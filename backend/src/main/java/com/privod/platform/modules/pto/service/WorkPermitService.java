package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.WorkPermit;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import com.privod.platform.modules.pto.repository.WorkPermitRepository;
import com.privod.platform.modules.pto.web.dto.CreateWorkPermitRequest;
import com.privod.platform.modules.pto.web.dto.WorkPermitResponse;
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
public class WorkPermitService {

    private final WorkPermitRepository workPermitRepository;
    private final PtoCodeGenerator codeGenerator;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WorkPermitResponse> listWorkPermits(UUID projectId, WorkPermitStatus status, Pageable pageable) {
        Specification<WorkPermit> spec = (root, query, cb) -> {
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
        return workPermitRepository.findAll(spec, pageable).map(WorkPermitResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkPermitResponse getWorkPermit(UUID id) {
        WorkPermit permit = getWorkPermitOrThrow(id);
        return WorkPermitResponse.fromEntity(permit);
    }

    @Transactional
    public WorkPermitResponse createWorkPermit(CreateWorkPermitRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Дата окончания не может быть раньше даты начала");
        }

        String code = codeGenerator.generateWorkPermitCode();

        WorkPermit permit = WorkPermit.builder()
                .projectId(request.projectId())
                .code(code)
                .workType(request.workType())
                .location(request.location())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(WorkPermitStatus.DRAFT)
                .issuedById(request.issuedById())
                .safetyMeasures(request.safetyMeasures())
                .notes(request.notes())
                .build();

        permit = workPermitRepository.save(permit);
        auditService.logCreate("WorkPermit", permit.getId());

        log.info("Work permit created: {} ({}) for project {}", permit.getCode(), permit.getId(), request.projectId());
        return WorkPermitResponse.fromEntity(permit);
    }

    @Transactional
    public WorkPermitResponse changeStatus(UUID id, WorkPermitStatus newStatus) {
        WorkPermit permit = getWorkPermitOrThrow(id);
        WorkPermitStatus oldStatus = permit.getStatus();

        if (!permit.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести наряд-допуск из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        permit.setStatus(newStatus);
        permit = workPermitRepository.save(permit);
        auditService.logStatusChange("WorkPermit", permit.getId(), oldStatus.name(), newStatus.name());

        log.info("Work permit status changed: {} from {} to {} ({})",
                permit.getCode(), oldStatus, newStatus, permit.getId());
        return WorkPermitResponse.fromEntity(permit);
    }

    @Transactional
    public void deleteWorkPermit(UUID id) {
        WorkPermit permit = getWorkPermitOrThrow(id);
        permit.softDelete();
        workPermitRepository.save(permit);
        auditService.logDelete("WorkPermit", id);
        log.info("Work permit deleted: {} ({})", permit.getCode(), id);
    }

    private WorkPermit getWorkPermitOrThrow(UUID id) {
        return workPermitRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Наряд-допуск не найден: " + id));
    }
}
