package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.FinancialJournal;
import com.privod.platform.modules.accounting.domain.JournalEntry;
import com.privod.platform.modules.accounting.domain.JournalEntryStatus;
import com.privod.platform.modules.accounting.domain.JournalLine;
import com.privod.platform.modules.accounting.domain.JournalType;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.accounting.repository.FinancialJournalRepository;
import com.privod.platform.modules.accounting.repository.JournalEntryRepository;
import com.privod.platform.modules.accounting.repository.JournalLineRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JournalService {

    private final FinancialJournalRepository journalRepository;
    private final JournalEntryRepository entryRepository;
    private final JournalLineRepository lineRepository;
    private final AuditService auditService;
    private final CounterpartyRepository counterpartyRepository;

    // === Financial Journals ===

    @Transactional(readOnly = true)
    public Page<FinancialJournal> listJournals(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return journalRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);
    }

    @Transactional
    public FinancialJournal createJournal(String code, String name, JournalType type) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        journalRepository.findByOrganizationIdAndCodeAndDeletedFalse(organizationId, code)
                .ifPresent(j -> {
                    throw new IllegalStateException("Журнал с кодом " + code + " уже существует");
                });

        FinancialJournal journal = FinancialJournal.builder()
                .organizationId(organizationId)
                .code(code)
                .name(name)
                .journalType(type)
                .active(true)
                .build();

        journal = journalRepository.save(journal);
        auditService.logCreate("FinancialJournal", journal.getId());

        log.info("Журнал создан: {} ({})", name, code);
        return journal;
    }

    @Transactional
    public FinancialJournal activateJournal(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FinancialJournal journal = getJournalOrThrow(id, organizationId);
        boolean previous = journal.isActive();
        if (!previous) {
            journal.setActive(true);
            journal = journalRepository.save(journal);
            auditService.logUpdate("FinancialJournal", journal.getId(), "active", "false", "true");
            log.info("Журнал активирован: {} ({})", journal.getName(), journal.getCode());
        }
        return journal;
    }

    @Transactional
    public FinancialJournal deactivateJournal(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FinancialJournal journal = getJournalOrThrow(id, organizationId);
        boolean previous = journal.isActive();
        if (previous) {
            journal.setActive(false);
            journal = journalRepository.save(journal);
            auditService.logUpdate("FinancialJournal", journal.getId(), "active", "true", "false");
            log.info("Журнал деактивирован: {} ({})", journal.getName(), journal.getCode());
        }
        return journal;
    }

    // === Journal Entries ===

    @Transactional(readOnly = true)
    public Page<JournalEntry> listEntries(UUID journalId, JournalEntryStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (journalId != null) {
            // Ensure caller can't enumerate other-tenant journals by ID.
            getJournalOrThrow(journalId, organizationId);
            return entryRepository.findByOrganizationIdAndJournalIdAndDeletedFalse(organizationId, journalId, pageable);
        }
        if (status != null) {
            return entryRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable);
        }
        return entryRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable);
    }

    @Transactional
    public JournalEntry createEntry(UUID journalId, LocalDate entryDate) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getJournalOrThrow(journalId, organizationId);

        long seq = entryRepository.getNextNumberSequence();
        String entryNumber = String.format("JE-%05d", seq);

        JournalEntry entry = JournalEntry.builder()
                .organizationId(organizationId)
                .journalId(journalId)
                .entryNumber(entryNumber)
                .entryDate(entryDate)
                .totalDebit(BigDecimal.ZERO)
                .totalCredit(BigDecimal.ZERO)
                .status(JournalEntryStatus.DRAFT)
                .build();

        entry = entryRepository.save(entry);
        auditService.logCreate("JournalEntry", entry.getId());

        log.info("Запись журнала создана: {}", entryNumber);
        return entry;
    }

    @Transactional
    public JournalEntry postEntry(UUID entryId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();
        JournalEntry entry = getEntryOrThrow(entryId, organizationId);
        JournalEntryStatus oldStatus = entry.getStatus();

        if (!entry.canTransitionTo(JournalEntryStatus.POSTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно провести запись из статуса %s", oldStatus.getDisplayName()));
        }

        // Recalculate totals from lines
        List<JournalLine> lines = lineRepository.findByEntryIdAndDeletedFalseOrderByCreatedAtAsc(entryId);
        BigDecimal totalDebit = lines.stream()
                .map(l -> l.getDebit() != null ? l.getDebit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = lines.stream()
                .map(l -> l.getCredit() != null ? l.getCredit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalStateException(
                    String.format("Дебет (%s) не равен кредиту (%s). Проводка не сбалансирована.",
                            totalDebit, totalCredit));
        }

        entry.setTotalDebit(totalDebit);
        entry.setTotalCredit(totalCredit);
        entry.setStatus(JournalEntryStatus.POSTED);
        entry.setPostedById(userId);
        entry = entryRepository.save(entry);
        auditService.logStatusChange("JournalEntry", entry.getId(),
                oldStatus.name(), JournalEntryStatus.POSTED.name());

        log.info("Запись журнала проведена: {} (Дт={}, Кт={})", entry.getEntryNumber(), totalDebit, totalCredit);
        return entry;
    }

    @Transactional
    public JournalLine addLine(UUID entryId, UUID accountId, BigDecimal debit,
                                BigDecimal credit, UUID partnerId, String description) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getEntryOrThrow(entryId, organizationId);

        if (partnerId != null) {
            counterpartyRepository.findByIdAndOrganizationIdAndDeletedFalse(partnerId, organizationId)
                    .orElseThrow(() -> new EntityNotFoundException("Контрагент не найден: " + partnerId));
        }

        JournalLine line = JournalLine.builder()
                .entryId(entryId)
                .accountId(accountId)
                .debit(debit != null ? debit : BigDecimal.ZERO)
                .credit(credit != null ? credit : BigDecimal.ZERO)
                .partnerId(partnerId)
                .description(description)
                .build();

        line = lineRepository.save(line);
        log.info("Строка журнала добавлена: Дт={}, Кт={} для записи {}", debit, credit, entryId);
        return line;
    }

    @Transactional(readOnly = true)
    public List<JournalLine> getEntryLines(UUID entryId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getEntryOrThrow(entryId, organizationId);
        return lineRepository.findByEntryIdAndDeletedFalseOrderByCreatedAtAsc(entryId);
    }

    // === Private helpers ===

    private FinancialJournal getJournalOrThrow(UUID id, UUID organizationId) {
        return journalRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Журнал не найден: " + id));
    }

    private JournalEntry getEntryOrThrow(UUID id, UUID organizationId) {
        return entryRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Запись журнала не найдена: " + id));
    }
}
