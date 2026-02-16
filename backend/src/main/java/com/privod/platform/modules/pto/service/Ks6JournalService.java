package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.Ks6Journal;
import com.privod.platform.modules.pto.domain.Ks6JournalStatus;
import com.privod.platform.modules.pto.domain.Ks6aRecord;
import com.privod.platform.modules.pto.repository.Ks6JournalRepository;
import com.privod.platform.modules.pto.repository.Ks6aRecordRepository;
import com.privod.platform.modules.pto.web.dto.CreateKs6JournalRequest;
import com.privod.platform.modules.pto.web.dto.CreateKs6aRecordRequest;
import com.privod.platform.modules.pto.web.dto.Ks6JournalResponse;
import com.privod.platform.modules.pto.web.dto.Ks6aRecordResponse;
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
public class Ks6JournalService {

    private final Ks6JournalRepository ks6Repository;
    private final Ks6aRecordRepository ks6aRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<Ks6JournalResponse> findAll(UUID projectId, Ks6JournalStatus status, Pageable pageable) {
        Specification<Ks6Journal> spec = (root, query, cb) -> {
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

        return ks6Repository.findAll(spec, pageable).map(Ks6JournalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Ks6JournalResponse findById(UUID id) {
        Ks6Journal journal = getOrThrow(id);
        return Ks6JournalResponse.fromEntity(journal);
    }

    @Transactional
    public Ks6JournalResponse create(CreateKs6JournalRequest request) {
        Ks6Journal journal = Ks6Journal.builder()
                .projectId(request.projectId())
                .startDate(request.startDate())
                .responsibleEngineerId(request.responsibleEngineerId())
                .status(Ks6JournalStatus.DRAFT)
                .notes(request.notes())
                .build();

        journal = ks6Repository.save(journal);
        auditService.logCreate("Ks6Journal", journal.getId());

        log.info("Журнал КС-6 создан для проекта: {} ({})", request.projectId(), journal.getId());
        return Ks6JournalResponse.fromEntity(journal);
    }

    @Transactional
    public Ks6JournalResponse activate(UUID id) {
        Ks6Journal journal = getOrThrow(id);
        Ks6JournalStatus oldStatus = journal.getStatus();
        journal.setStatus(Ks6JournalStatus.ACTIVE);
        journal = ks6Repository.save(journal);
        auditService.logStatusChange("Ks6Journal", id, oldStatus.name(), Ks6JournalStatus.ACTIVE.name());
        return Ks6JournalResponse.fromEntity(journal);
    }

    @Transactional
    public Ks6JournalResponse close(UUID id) {
        Ks6Journal journal = getOrThrow(id);
        Ks6JournalStatus oldStatus = journal.getStatus();
        journal.setStatus(Ks6JournalStatus.CLOSED);
        journal = ks6Repository.save(journal);
        auditService.logStatusChange("Ks6Journal", id, oldStatus.name(), Ks6JournalStatus.CLOSED.name());
        return Ks6JournalResponse.fromEntity(journal);
    }

    @Transactional
    public void delete(UUID id) {
        Ks6Journal journal = getOrThrow(id);
        journal.softDelete();
        ks6Repository.save(journal);
        auditService.logDelete("Ks6Journal", id);
        log.info("Журнал КС-6 удалён: {}", id);
    }

    // --- KS-6a Records ---

    @Transactional(readOnly = true)
    public Page<Ks6aRecordResponse> findRecords(UUID ks6JournalId, Pageable pageable) {
        getOrThrow(ks6JournalId);
        return ks6aRepository.findByKs6JournalIdAndDeletedFalse(ks6JournalId, pageable)
                .map(Ks6aRecordResponse::fromEntity);
    }

    @Transactional
    public Ks6aRecordResponse addRecord(CreateKs6aRecordRequest request) {
        getOrThrow(request.ks6JournalId());

        Ks6aRecord record = Ks6aRecord.builder()
                .ks6JournalId(request.ks6JournalId())
                .monthYear(request.monthYear())
                .workName(request.workName())
                .unit(request.unit())
                .plannedVolume(request.plannedVolume())
                .first10days(request.first10days())
                .second10days(request.second10days())
                .third10days(request.third10days())
                .totalActual(request.totalActual())
                .notes(request.notes())
                .build();

        record = ks6aRepository.save(record);
        auditService.logCreate("Ks6aRecord", record.getId());

        log.info("Запись КС-6а добавлена: {} в журнал {}", record.getWorkName(), request.ks6JournalId());
        return Ks6aRecordResponse.fromEntity(record);
    }

    @Transactional
    public void deleteRecord(UUID recordId) {
        Ks6aRecord record = ks6aRepository.findById(recordId)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись КС-6а не найдена: " + recordId));
        record.softDelete();
        ks6aRepository.save(record);
        auditService.logDelete("Ks6aRecord", recordId);
    }

    private Ks6Journal getOrThrow(UUID id) {
        return ks6Repository.findById(id)
                .filter(j -> !j.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Журнал КС-6 не найден: " + id));
    }
}
