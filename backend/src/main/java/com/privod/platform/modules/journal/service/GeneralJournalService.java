package com.privod.platform.modules.journal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.journal.domain.GeneralJournal;
import com.privod.platform.modules.journal.domain.GeneralJournalEntry;
import com.privod.platform.modules.journal.domain.JournalStatus;
import com.privod.platform.modules.journal.repository.GeneralJournalEntryRepository;
import com.privod.platform.modules.journal.repository.GeneralJournalRepository;
import com.privod.platform.modules.journal.web.dto.CreateJournalEntryRequest;
import com.privod.platform.modules.journal.web.dto.CreateJournalRequest;
import com.privod.platform.modules.journal.web.dto.JournalEntryResponse;
import com.privod.platform.modules.journal.web.dto.JournalResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralJournalService {

    private final GeneralJournalRepository journalRepository;
    private final GeneralJournalEntryRepository entryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<JournalResponse> findAll(UUID projectId, JournalStatus status, Pageable pageable) {
        Specification<GeneralJournal> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return journalRepository.findAll(spec, pageable).map(JournalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public JournalResponse findById(UUID id) {
        GeneralJournal journal = getOrThrow(id);
        return JournalResponse.fromEntity(journal);
    }

    @Transactional
    public JournalResponse create(CreateJournalRequest request) {
        GeneralJournal journal = GeneralJournal.builder()
                .projectId(request.projectId())
                .name(request.name())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(JournalStatus.DRAFT)
                .responsibleId(request.responsibleId())
                .notes(request.notes())
                .build();

        journal = journalRepository.save(journal);
        auditService.logCreate("GeneralJournal", journal.getId());

        log.info("Общий журнал работ создан: {} ({})", journal.getName(), journal.getId());
        return JournalResponse.fromEntity(journal);
    }

    @Transactional
    public JournalResponse update(UUID id, CreateJournalRequest request) {
        GeneralJournal journal = getOrThrow(id);

        if (request.name() != null) {
            journal.setName(request.name());
        }
        if (request.startDate() != null) {
            journal.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            journal.setEndDate(request.endDate());
        }
        if (request.responsibleId() != null) {
            journal.setResponsibleId(request.responsibleId());
        }
        if (request.notes() != null) {
            journal.setNotes(request.notes());
        }

        journal = journalRepository.save(journal);
        auditService.logUpdate("GeneralJournal", id, "multiple", null, null);

        log.info("Общий журнал работ обновлён: {} ({})", journal.getName(), journal.getId());
        return JournalResponse.fromEntity(journal);
    }

    @Transactional
    public JournalResponse closeJournal(UUID id) {
        GeneralJournal journal = getOrThrow(id);

        if (journal.getStatus() == JournalStatus.CLOSED || journal.getStatus() == JournalStatus.ARCHIVED) {
            throw new IllegalStateException("Журнал уже закрыт или архивирован");
        }

        JournalStatus oldStatus = journal.getStatus();
        journal.setStatus(JournalStatus.CLOSED);
        journal = journalRepository.save(journal);
        auditService.logStatusChange("GeneralJournal", id, oldStatus.name(), JournalStatus.CLOSED.name());

        log.info("Общий журнал работ закрыт: {} ({})", journal.getName(), journal.getId());
        return JournalResponse.fromEntity(journal);
    }

    @Transactional
    public void delete(UUID id) {
        GeneralJournal journal = getOrThrow(id);
        journal.softDelete();
        journalRepository.save(journal);
        auditService.logDelete("GeneralJournal", id);
        log.info("Общий журнал работ удалён: {} ({})", journal.getName(), id);
    }

    // --- Entry methods ---

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> findEntries(UUID journalId, Pageable pageable) {
        getOrThrow(journalId);
        return entryRepository.findByJournalIdAndDeletedFalse(journalId, pageable)
                .map(JournalEntryResponse::fromEntity);
    }

    @Transactional
    public JournalEntryResponse addEntry(CreateJournalEntryRequest request) {
        GeneralJournal journal = getOrThrow(request.journalId());

        if (journal.getStatus() == JournalStatus.CLOSED || journal.getStatus() == JournalStatus.ARCHIVED) {
            throw new IllegalStateException("Нельзя добавить запись в закрытый или архивированный журнал");
        }

        GeneralJournalEntry entry = GeneralJournalEntry.builder()
                .journalId(request.journalId())
                .date(request.date())
                .section(request.section())
                .workDescription(request.workDescription())
                .volume(request.volume())
                .unit(request.unit())
                .crew(request.crew())
                .weatherConditions(request.weatherConditions())
                .notes(request.notes())
                .build();

        entry = entryRepository.save(entry);
        auditService.logCreate("GeneralJournalEntry", entry.getId());

        log.info("Запись добавлена в журнал {}: {}", journal.getName(), entry.getId());
        return JournalEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID entryId) {
        GeneralJournalEntry entry = entryRepository.findById(entryId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись журнала не найдена: " + entryId));

        entry.softDelete();
        entryRepository.save(entry);
        auditService.logDelete("GeneralJournalEntry", entryId);
        log.info("Запись журнала удалена: {}", entryId);
    }

    private GeneralJournal getOrThrow(UUID id) {
        return journalRepository.findById(id)
                .filter(j -> !j.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Общий журнал работ не найден: " + id));
    }
}
