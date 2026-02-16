package com.privod.platform.modules.dataExchange.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dataExchange.domain.ExportFormat;
import com.privod.platform.modules.dataExchange.domain.ExportJob;
import com.privod.platform.modules.dataExchange.repository.ExportJobRepository;
import com.privod.platform.modules.dataExchange.web.dto.CreateExportJobRequest;
import com.privod.platform.modules.dataExchange.web.dto.ExportJobResponse;
import com.privod.platform.modules.dataExchange.web.dto.UpdateExportJobRequest;
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
public class ExportJobService {

    private final ExportJobRepository exportJobRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ExportJobResponse> findAll(String entityType, ExportFormat format, UUID projectId,
                                            Pageable pageable) {
        Specification<ExportJob> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (format != null) {
                predicates.add(cb.equal(root.get("format"), format));
            }
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return exportJobRepository.findAll(spec, pageable).map(ExportJobResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ExportJobResponse findById(UUID id) {
        ExportJob job = getOrThrow(id);
        return ExportJobResponse.fromEntity(job);
    }

    @Transactional
    public ExportJobResponse create(CreateExportJobRequest request) {
        ExportJob job = ExportJob.builder()
                .entityType(request.entityType())
                .format(request.format())
                .fileName(request.fileName())
                .filters(request.filters())
                .status("PENDING")
                .startedAt(Instant.now())
                .requestedById(request.requestedById())
                .projectId(request.projectId())
                .build();

        job = exportJobRepository.save(job);
        auditService.logCreate("ExportJob", job.getId());

        log.info("Задача экспорта создана: {} формат={} ({})",
                job.getEntityType(), job.getFormat(), job.getId());
        return ExportJobResponse.fromEntity(job);
    }

    @Transactional
    public ExportJobResponse update(UUID id, UpdateExportJobRequest request) {
        ExportJob job = getOrThrow(id);

        if (request.status() != null) {
            String oldStatus = job.getStatus();
            job.setStatus(request.status());

            if ("COMPLETED".equals(request.status()) || "FAILED".equals(request.status())) {
                job.setCompletedAt(Instant.now());
            }

            auditService.logStatusChange("ExportJob", id,
                    oldStatus != null ? oldStatus : "null", request.status());
        }
        if (request.totalRows() != null) {
            job.setTotalRows(request.totalRows());
        }
        if (request.fileUrl() != null) {
            job.setFileUrl(request.fileUrl());
        }

        job = exportJobRepository.save(job);
        auditService.logUpdate("ExportJob", id, "multiple", null, null);

        log.info("Задача экспорта обновлена: {} ({})", job.getEntityType(), job.getId());
        return ExportJobResponse.fromEntity(job);
    }

    @Transactional
    public void delete(UUID id) {
        ExportJob job = getOrThrow(id);
        job.softDelete();
        exportJobRepository.save(job);
        auditService.logDelete("ExportJob", id);
        log.info("Задача экспорта удалена: {} ({})", job.getEntityType(), id);
    }

    private ExportJob getOrThrow(UUID id) {
        return exportJobRepository.findById(id)
                .filter(j -> !j.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача экспорта не найдена: " + id));
    }
}
