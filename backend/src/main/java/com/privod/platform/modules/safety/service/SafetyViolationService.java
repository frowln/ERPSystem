package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.domain.ViolationSeverity;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.web.dto.CreateViolationRequest;
import com.privod.platform.modules.safety.web.dto.ResolveViolationRequest;
import com.privod.platform.modules.safety.web.dto.ViolationDashboardResponse;
import com.privod.platform.modules.safety.web.dto.ViolationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyViolationService {

    private final SafetyViolationRepository violationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ViolationResponse> listAll(Pageable pageable) {
        return violationRepository.findByDeletedFalse(pageable)
                .map(ViolationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ViolationResponse getViolation(UUID id) {
        SafetyViolation violation = getViolationOrThrow(id);
        return ViolationResponse.fromEntity(violation);
    }

    @Transactional
    public ViolationResponse createViolation(CreateViolationRequest request) {
        SafetyViolation violation = SafetyViolation.builder()
                .inspectionId(request.inspectionId())
                .incidentId(request.incidentId())
                .description(request.description())
                .severity(request.severity())
                .dueDate(request.dueDate())
                .assignedToId(request.assignedToId())
                .assignedToName(request.assignedToName())
                .build();

        violation = violationRepository.save(violation);
        auditService.logCreate("SafetyViolation", violation.getId());

        log.info("Safety violation created: {} ({})", violation.getDescription(), violation.getId());
        return ViolationResponse.fromEntity(violation);
    }

    @Transactional
    public ViolationResponse updateViolation(UUID id, CreateViolationRequest request) {
        SafetyViolation violation = getViolationOrThrow(id);

        if (request.description() != null) violation.setDescription(request.description());
        if (request.severity() != null) violation.setSeverity(request.severity());
        if (request.dueDate() != null) violation.setDueDate(request.dueDate());
        if (request.assignedToId() != null) violation.setAssignedToId(request.assignedToId());
        if (request.assignedToName() != null) violation.setAssignedToName(request.assignedToName());

        violation = violationRepository.save(violation);
        auditService.logUpdate("SafetyViolation", violation.getId(), "multiple", null, null);

        log.info("Safety violation updated: {}", violation.getId());
        return ViolationResponse.fromEntity(violation);
    }

    @Transactional
    public void deleteViolation(UUID id) {
        SafetyViolation violation = getViolationOrThrow(id);
        violation.softDelete();
        violationRepository.save(violation);
        auditService.logDelete("SafetyViolation", id);
        log.info("Safety violation deleted: {}", id);
    }

    @Transactional
    public ViolationResponse resolveViolation(UUID id, ResolveViolationRequest request) {
        SafetyViolation violation = getViolationOrThrow(id);

        if (violation.getStatus() == ViolationStatus.RESOLVED) {
            throw new IllegalStateException("Нарушение уже устранено");
        }

        ViolationStatus oldStatus = violation.getStatus();
        violation.setStatus(ViolationStatus.RESOLVED);
        violation.setResolvedAt(Instant.now());
        violation.setResolution(request.resolution());

        violation = violationRepository.save(violation);
        auditService.logStatusChange("SafetyViolation", violation.getId(),
                oldStatus.name(), ViolationStatus.RESOLVED.name());

        log.info("Safety violation resolved: {}", violation.getId());
        return ViolationResponse.fromEntity(violation);
    }

    @Transactional(readOnly = true)
    public List<ViolationResponse> getOverdueViolations() {
        return violationRepository.findOverdue()
                .stream()
                .map(ViolationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ViolationResponse> listByStatus(ViolationStatus status, Pageable pageable) {
        return violationRepository.findByStatusAndDeletedFalse(status, pageable)
                .map(ViolationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ViolationDashboardResponse getDashboard() {
        long totalViolations = violationRepository.countTotal();
        long overdueViolations = violationRepository.countOverdue();

        Map<String, Long> severityCounts = new HashMap<>();
        for (Object[] row : violationRepository.countBySeverity()) {
            ViolationSeverity sev = (ViolationSeverity) row[0];
            Long count = (Long) row[1];
            severityCounts.put(sev.name(), count);
        }

        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : violationRepository.countByStatus()) {
            ViolationStatus status = (ViolationStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        return new ViolationDashboardResponse(
                totalViolations, overdueViolations, severityCounts, statusCounts
        );
    }

    private SafetyViolation getViolationOrThrow(UUID id) {
        return violationRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Нарушение не найдено: " + id));
    }
}
