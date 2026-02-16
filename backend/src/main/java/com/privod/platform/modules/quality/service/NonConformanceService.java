package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.NonConformance;
import com.privod.platform.modules.quality.domain.NonConformanceStatus;
import com.privod.platform.modules.quality.repository.NonConformanceRepository;
import com.privod.platform.modules.quality.web.dto.CreateNonConformanceRequest;
import com.privod.platform.modules.quality.web.dto.NonConformanceResponse;
import com.privod.platform.modules.quality.web.dto.UpdateNonConformanceRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NonConformanceService {

    private final NonConformanceRepository nonConformanceRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<NonConformanceResponse> listNonConformances(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return nonConformanceRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(NonConformanceResponse::fromEntity);
        }
        return nonConformanceRepository.findByDeletedFalse(pageable)
                .map(NonConformanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public NonConformanceResponse getNonConformance(UUID id) {
        NonConformance nc = getNonConformanceOrThrow(id);
        return NonConformanceResponse.fromEntity(nc);
    }

    @Transactional
    public NonConformanceResponse createNonConformance(CreateNonConformanceRequest request) {
        String code = generateCode();

        NonConformance nc = NonConformance.builder()
                .code(code)
                .qualityCheckId(request.qualityCheckId())
                .projectId(request.projectId())
                .severity(request.severity())
                .description(request.description())
                .rootCause(request.rootCause())
                .correctiveAction(request.correctiveAction())
                .preventiveAction(request.preventiveAction())
                .status(NonConformanceStatus.OPEN)
                .responsibleId(request.responsibleId())
                .dueDate(request.dueDate())
                .cost(request.cost() != null ? request.cost() : BigDecimal.ZERO)
                .build();

        nc = nonConformanceRepository.save(nc);
        auditService.logCreate("NonConformance", nc.getId());

        log.info("Non-conformance created: {} - {} ({})", nc.getCode(), nc.getSeverity(), nc.getId());
        return NonConformanceResponse.fromEntity(nc);
    }

    @Transactional
    public NonConformanceResponse updateNonConformance(UUID id, UpdateNonConformanceRequest request) {
        NonConformance nc = getNonConformanceOrThrow(id);

        if (request.severity() != null) {
            nc.setSeverity(request.severity());
        }
        if (request.description() != null) {
            nc.setDescription(request.description());
        }
        if (request.rootCause() != null) {
            nc.setRootCause(request.rootCause());
        }
        if (request.correctiveAction() != null) {
            nc.setCorrectiveAction(request.correctiveAction());
        }
        if (request.preventiveAction() != null) {
            nc.setPreventiveAction(request.preventiveAction());
        }
        if (request.status() != null) {
            NonConformanceStatus oldStatus = nc.getStatus();
            nc.setStatus(request.status());
            auditService.logStatusChange("NonConformance", nc.getId(),
                    oldStatus.name(), request.status().name());
        }
        if (request.responsibleId() != null) {
            nc.setResponsibleId(request.responsibleId());
        }
        if (request.dueDate() != null) {
            nc.setDueDate(request.dueDate());
        }
        if (request.resolvedDate() != null) {
            nc.setResolvedDate(request.resolvedDate());
        }
        if (request.cost() != null) {
            nc.setCost(request.cost());
        }

        nc = nonConformanceRepository.save(nc);
        auditService.logUpdate("NonConformance", nc.getId(), "multiple", null, null);

        log.info("Non-conformance updated: {} ({})", nc.getCode(), nc.getId());
        return NonConformanceResponse.fromEntity(nc);
    }

    @Transactional
    public NonConformanceResponse closeNonConformance(UUID id) {
        NonConformance nc = getNonConformanceOrThrow(id);

        if (nc.getStatus() == NonConformanceStatus.CLOSED) {
            throw new IllegalStateException("Несоответствие уже закрыто");
        }

        NonConformanceStatus oldStatus = nc.getStatus();
        nc.setStatus(NonConformanceStatus.CLOSED);
        nc.setResolvedDate(LocalDate.now());

        nc = nonConformanceRepository.save(nc);
        auditService.logStatusChange("NonConformance", nc.getId(),
                oldStatus.name(), NonConformanceStatus.CLOSED.name());

        log.info("Non-conformance closed: {} ({})", nc.getCode(), nc.getId());
        return NonConformanceResponse.fromEntity(nc);
    }

    @Transactional
    public void deleteNonConformance(UUID id) {
        NonConformance nc = getNonConformanceOrThrow(id);
        nc.softDelete();
        nonConformanceRepository.save(nc);
        auditService.logDelete("NonConformance", nc.getId());

        log.info("Non-conformance deleted: {} ({})", nc.getCode(), nc.getId());
    }

    private NonConformance getNonConformanceOrThrow(UUID id) {
        return nonConformanceRepository.findById(id)
                .filter(nc -> !nc.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Несоответствие не найдено: " + id));
    }

    private String generateCode() {
        long seq = nonConformanceRepository.getNextNumberSequence();
        return String.format("NCR-%05d", seq);
    }
}
