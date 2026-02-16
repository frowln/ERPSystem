package com.privod.platform.modules.dataExchange.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dataExchange.domain.ImportJob;
import com.privod.platform.modules.dataExchange.domain.ImportStatus;
import com.privod.platform.modules.dataExchange.repository.ImportJobRepository;
import com.privod.platform.modules.dataExchange.web.dto.CreateImportJobRequest;
import com.privod.platform.modules.dataExchange.web.dto.ImportJobResponse;
import com.privod.platform.modules.dataExchange.web.dto.UpdateImportJobRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportJobService {

    private final ImportJobRepository importJobRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ImportJobResponse> findAll(String entityType, ImportStatus status, UUID projectId,
                                            Pageable pageable) {
        Specification<ImportJob> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return importJobRepository.findAll(spec, pageable).map(ImportJobResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ImportJobResponse findById(UUID id) {
        ImportJob job = getOrThrow(id);
        return ImportJobResponse.fromEntity(job);
    }

    @Transactional
    public ImportJobResponse create(CreateImportJobRequest request) {
        ImportJob job = ImportJob.builder()
                .entityType(request.entityType())
                .fileName(request.fileName())
                .fileSize(request.fileSize())
                .status(ImportStatus.PENDING)
                .totalRows(request.totalRows())
                .processedRows(0)
                .successRows(0)
                .errorRows(0)
                .mappingId(request.mappingId())
                .startedById(request.startedById())
                .projectId(request.projectId())
                .build();

        job = importJobRepository.save(job);
        auditService.logCreate("ImportJob", job.getId());

        log.info("Задача импорта создана: {} файл={} ({})", job.getEntityType(), job.getFileName(), job.getId());
        return ImportJobResponse.fromEntity(job);
    }

    @Transactional
    public ImportJobResponse update(UUID id, UpdateImportJobRequest request) {
        ImportJob job = getOrThrow(id);

        if (request.status() != null) {
            ImportStatus oldStatus = job.getStatus();
            job.setStatus(request.status());

            if (request.status() == ImportStatus.IMPORTING && job.getStartedAt() == null) {
                job.setStartedAt(Instant.now());
            }
            if (request.status() == ImportStatus.COMPLETED || request.status() == ImportStatus.FAILED) {
                job.setCompletedAt(Instant.now());
            }

            auditService.logStatusChange("ImportJob", id, oldStatus.name(), request.status().name());
        }
        if (request.totalRows() != null) {
            job.setTotalRows(request.totalRows());
        }
        if (request.processedRows() != null) {
            job.setProcessedRows(request.processedRows());
        }
        if (request.successRows() != null) {
            job.setSuccessRows(request.successRows());
        }
        if (request.errorRows() != null) {
            job.setErrorRows(request.errorRows());
        }
        if (request.errors() != null) {
            job.setErrors(request.errors());
        }

        job = importJobRepository.save(job);
        auditService.logUpdate("ImportJob", id, "multiple", null, null);

        log.info("Задача импорта обновлена: {} ({})", job.getEntityType(), job.getId());
        return ImportJobResponse.fromEntity(job);
    }

    @Transactional
    public ImportJobResponse cancel(UUID id) {
        ImportJob job = getOrThrow(id);

        if (job.getStatus() == ImportStatus.COMPLETED || job.getStatus() == ImportStatus.CANCELLED) {
            throw new IllegalStateException("Невозможно отменить задачу импорта в статусе: " + job.getStatus().getDisplayName());
        }

        ImportStatus oldStatus = job.getStatus();
        job.setStatus(ImportStatus.CANCELLED);
        job.setCompletedAt(Instant.now());

        job = importJobRepository.save(job);
        auditService.logStatusChange("ImportJob", id, oldStatus.name(), ImportStatus.CANCELLED.name());

        log.info("Задача импорта отменена: {} ({})", job.getEntityType(), job.getId());
        return ImportJobResponse.fromEntity(job);
    }

    @Transactional
    public void delete(UUID id) {
        ImportJob job = getOrThrow(id);
        job.softDelete();
        importJobRepository.save(job);
        auditService.logDelete("ImportJob", id);
        log.info("Задача импорта удалена: {} ({})", job.getEntityType(), id);
    }

    private ImportJob getOrThrow(UUID id) {
        return importJobRepository.findById(id)
                .filter(j -> !j.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача импорта не найдена: " + id));
    }
}
