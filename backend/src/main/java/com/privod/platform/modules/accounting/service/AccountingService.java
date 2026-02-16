package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.AccountEntry;
import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.AccountPlan;
import com.privod.platform.modules.accounting.domain.AccountType;
import com.privod.platform.modules.accounting.domain.FinancialJournal;
import com.privod.platform.modules.accounting.domain.PeriodStatus;
import com.privod.platform.modules.accounting.repository.AccountEntryRepository;
import com.privod.platform.modules.accounting.repository.AccountPeriodRepository;
import com.privod.platform.modules.accounting.repository.AccountPlanRepository;
import com.privod.platform.modules.accounting.repository.FinancialJournalRepository;
import com.privod.platform.modules.accounting.web.dto.AccountEntryResponse;
import com.privod.platform.modules.accounting.web.dto.AccountPeriodResponse;
import com.privod.platform.modules.accounting.web.dto.AccountPlanResponse;
import com.privod.platform.modules.accounting.web.dto.CreateAccountEntryRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingService {

    private final AccountPlanRepository accountPlanRepository;
    private final AccountPeriodRepository accountPeriodRepository;
    private final AccountEntryRepository accountEntryRepository;
    private final FinancialJournalRepository financialJournalRepository;
    private final AuditService auditService;

    // === Account Plan ===

    @Transactional(readOnly = true)
    public Page<AccountPlanResponse> listAccountPlans(AccountType type, Pageable pageable) {
        if (type != null) {
            return accountPlanRepository.findByAccountTypeAndDeletedFalse(type, pageable)
                    .map(AccountPlanResponse::fromEntity);
        }
        return accountPlanRepository.findByDeletedFalse(pageable)
                .map(AccountPlanResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AccountPlanResponse getAccountPlan(UUID id) {
        AccountPlan plan = getAccountPlanOrThrow(id);
        return AccountPlanResponse.fromEntity(plan);
    }

    // === Account Periods ===

    @Transactional(readOnly = true)
    public Page<AccountPeriodResponse> listPeriods(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return accountPeriodRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(AccountPeriodResponse::fromEntity);
    }

    @Transactional
    public AccountPeriod openPeriod(int year, int month) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        accountPeriodRepository.findByOrganizationIdAndYearAndMonthAndDeletedFalse(organizationId, year, month)
                .ifPresent(p -> {
                    throw new IllegalStateException(
                            String.format("Период %d/%02d уже существует", year, month));
                });

        AccountPeriod period = AccountPeriod.builder()
                .organizationId(organizationId)
                .year(year)
                .month(month)
                .status(PeriodStatus.OPEN)
                .build();

        period = accountPeriodRepository.save(period);
        auditService.logCreate("AccountPeriod", period.getId());

        log.info("Период открыт: {}/{}", year, month);
        return period;
    }

    @Transactional
    public AccountPeriod closePeriod(UUID periodId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountPeriod period = getPeriodOrThrow(periodId, organizationId);
        if (period.getStatus() != PeriodStatus.OPEN) {
            throw new IllegalStateException("Закрыть можно только открытый период");
        }

        period.setStatus(PeriodStatus.CLOSED);
        period.setClosedAt(Instant.now());
        period = accountPeriodRepository.save(period);
        auditService.logStatusChange("AccountPeriod", period.getId(), "OPEN", "CLOSED");

        log.info("Период закрыт: {}/{}", period.getYear(), period.getMonth());
        return period;
    }

    // === Account Entries ===

    @Transactional(readOnly = true)
    public Page<AccountEntryResponse> listEntries(UUID periodId, UUID journalId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (periodId != null) {
            return accountEntryRepository.findByOrganizationIdAndPeriodIdAndDeletedFalse(organizationId, periodId, pageable)
                    .map(AccountEntryResponse::fromEntity);
        }
        if (journalId != null) {
            return accountEntryRepository.findByOrganizationIdAndJournalIdAndDeletedFalse(organizationId, journalId, pageable)
                    .map(AccountEntryResponse::fromEntity);
        }
        return accountEntryRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(AccountEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AccountEntryResponse getEntry(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountEntry entry = accountEntryRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проводка не найдена: " + id));
        return AccountEntryResponse.fromEntity(entry);
    }

    @Transactional
    public AccountEntryResponse createEntry(CreateAccountEntryRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountPeriod period = getPeriodOrThrow(request.periodId(), organizationId);
        if (!period.isOpen()) {
            throw new IllegalStateException("Невозможно создать проводку в закрытом периоде");
        }

        getAccountPlanOrThrow(request.debitAccountId());
        getAccountPlanOrThrow(request.creditAccountId());
        getFinancialJournalOrThrow(request.journalId(), organizationId);

        AccountEntry entry = AccountEntry.builder()
                .organizationId(organizationId)
                .journalId(request.journalId())
                .debitAccountId(request.debitAccountId())
                .creditAccountId(request.creditAccountId())
                .amount(request.amount())
                .entryDate(request.entryDate())
                .description(request.description())
                .documentType(request.documentType())
                .documentId(request.documentId())
                .periodId(request.periodId())
                .build();

        entry = accountEntryRepository.save(entry);
        auditService.logCreate("AccountEntry", entry.getId());

        log.info("Проводка создана: Дт {} Кт {} на {} руб.",
                request.debitAccountId(), request.creditAccountId(), request.amount());
        return AccountEntryResponse.fromEntity(entry);
    }

    @Transactional
    public AccountEntryResponse updateEntry(UUID id, CreateAccountEntryRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountEntry entry = accountEntryRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проводка не найдена: " + id));

        if (request.debitAccountId() != null) entry.setDebitAccountId(request.debitAccountId());
        if (request.creditAccountId() != null) entry.setCreditAccountId(request.creditAccountId());
        if (request.amount() != null) entry.setAmount(request.amount());
        if (request.entryDate() != null) entry.setEntryDate(request.entryDate());
        if (request.description() != null) entry.setDescription(request.description());
        if (request.documentType() != null) entry.setDocumentType(request.documentType());
        if (request.documentId() != null) entry.setDocumentId(request.documentId());

        if (request.journalId() != null) {
            getFinancialJournalOrThrow(request.journalId(), organizationId);
            entry.setJournalId(request.journalId());
        }
        if (request.periodId() != null) {
            AccountPeriod period = getPeriodOrThrow(request.periodId(), organizationId);
            entry.setPeriodId(period.getId());
        }

        entry = accountEntryRepository.save(entry);
        auditService.logUpdate("AccountEntry", entry.getId(), "multiple", null, null);

        log.info("Проводка обновлена: {}", entry.getId());
        return AccountEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountEntry entry = accountEntryRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проводка не найдена: " + id));

        entry.softDelete();
        accountEntryRepository.save(entry);
        auditService.logDelete("AccountEntry", id);

        log.info("Проводка удалена: {}", id);
    }

    @Transactional
    public int deleteEntries(List<UUID> ids) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> uniqueIds = new java.util.ArrayList<>(new LinkedHashSet<>(ids));
        if (uniqueIds.isEmpty()) {
            return 0;
        }

        List<AccountEntry> entries = accountEntryRepository.findByOrganizationIdAndIdInAndDeletedFalse(organizationId, uniqueIds);
        Set<UUID> foundIds = entries.stream().map(AccountEntry::getId).collect(java.util.stream.Collectors.toSet());
        List<UUID> missingIds = uniqueIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new EntityNotFoundException("Проводки не найдены: " + missingIds);
        }

        entries.forEach(AccountEntry::softDelete);
        accountEntryRepository.saveAll(entries);
        entries.forEach(entry -> auditService.logDelete("AccountEntry", entry.getId()));

        log.info("Массовое удаление проводок: {} шт.", entries.size());
        return entries.size();
    }

    // === Private helpers ===

    private AccountPlan getAccountPlanOrThrow(UUID id) {
        return accountPlanRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Счёт не найден: " + id));
    }

    private AccountPeriod getPeriodOrThrow(UUID id, UUID organizationId) {
        return accountPeriodRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Период не найден: " + id));
    }

    private FinancialJournal getFinancialJournalOrThrow(UUID id, UUID organizationId) {
        return financialJournalRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Журнал не найден: " + id));
    }
}
