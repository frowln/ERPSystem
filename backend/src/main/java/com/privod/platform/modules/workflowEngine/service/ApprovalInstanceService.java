package com.privod.platform.modules.workflowEngine.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.workflowEngine.domain.ApprovalDecision;
import com.privod.platform.modules.workflowEngine.domain.ApprovalDecisionType;
import com.privod.platform.modules.workflowEngine.domain.ApprovalInstance;
import com.privod.platform.modules.workflowEngine.domain.ApprovalInstanceStatus;
import com.privod.platform.modules.workflowEngine.domain.WorkflowDefinition;
import com.privod.platform.modules.workflowEngine.domain.WorkflowStep;
import com.privod.platform.modules.workflowEngine.repository.ApprovalDecisionRepository;
import com.privod.platform.modules.workflowEngine.repository.ApprovalInstanceRepository;
import com.privod.platform.modules.workflowEngine.repository.WorkflowDefinitionRepository;
import com.privod.platform.modules.workflowEngine.repository.WorkflowStepRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalInstanceService {

    private final ApprovalInstanceRepository approvalInstanceRepository;
    private final ApprovalDecisionRepository approvalDecisionRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final AuditService auditService;

    // ── Response / Request records ──────────────────────────────────────────────

    public record ApprovalInstanceResponse(
            UUID id,
            UUID entityId,
            String entityType,
            String entityNumber,
            UUID workflowDefinitionId,
            String workflowName,
            UUID currentStepId,
            String currentStepName,
            int currentStepOrder,
            String status,
            UUID initiatedById,
            Instant slaDeadline,
            boolean isOverdue,
            UUID escalatedTo,
            UUID delegatedTo,
            String notes,
            Instant createdAt,
            Instant completedAt
    ) {}

    public record ApprovalDecisionResponse(
            UUID id,
            UUID approvalInstanceId,
            UUID workflowStepId,
            String stepName,
            int stepOrder,
            UUID approverId,
            String decision,
            String comments,
            Instant decidedAt
    ) {}

    public record StartApprovalRequest(
            UUID entityId,
            String entityType,
            String entityNumber,
            String notes
    ) {}

    public record SubmitDecisionRequest(
            String decision,
            String comments
    ) {}

    public record DelegateRequest(
            UUID delegateToId,
            String comments
    ) {}

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Start a new approval workflow for an entity.
     */
    @Transactional
    public ApprovalInstanceResponse startApproval(StartApprovalRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        // Ensure no active approval already exists for this entity
        approvalInstanceRepository.findByEntityIdAndEntityTypeAndStatusAndDeletedFalse(
                request.entityId(), request.entityType(), ApprovalInstanceStatus.IN_PROGRESS
        ).ifPresent(existing -> {
            throw new IllegalStateException(
                    "Активный процесс согласования уже существует для " + request.entityType() + " " + request.entityId());
        });

        // Find active workflow definition for entity type
        List<WorkflowDefinition> definitions = workflowDefinitionRepository
                .findByEntityTypeAndIsActiveTrueAndDeletedFalse(request.entityType());
        if (definitions.isEmpty()) {
            throw new EntityNotFoundException(
                    "Не найден активный маршрут согласования для типа: " + request.entityType());
        }
        WorkflowDefinition definition = definitions.get(0);

        // Get workflow steps ordered by sortOrder
        List<WorkflowStep> steps = workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(definition.getId());
        if (steps.isEmpty()) {
            throw new IllegalStateException(
                    "Маршрут согласования не содержит шагов: " + definition.getName());
        }

        WorkflowStep firstStep = steps.get(0);

        // Calculate SLA deadline
        Instant slaDeadline = null;
        if (firstStep.getSlaHours() != null && firstStep.getSlaHours() > 0) {
            slaDeadline = Instant.now().plus(firstStep.getSlaHours(), ChronoUnit.HOURS);
        }

        ApprovalInstance instance = ApprovalInstance.builder()
                .organizationId(orgId)
                .workflowDefinitionId(definition.getId())
                .entityId(request.entityId())
                .entityType(request.entityType())
                .entityNumber(request.entityNumber())
                .currentStepId(firstStep.getId())
                .currentStepOrder(firstStep.getSortOrder() != null ? firstStep.getSortOrder() : 0)
                .status(ApprovalInstanceStatus.IN_PROGRESS)
                .initiatedById(userId)
                .slaDeadline(slaDeadline)
                .notes(request.notes())
                .build();

        instance = approvalInstanceRepository.save(instance);
        auditService.logCreate("ApprovalInstance", instance.getId());

        log.info("Approval workflow started: instance={} entity={}:{} workflow={}",
                instance.getId(), request.entityType(), request.entityId(), definition.getName());

        return toResponse(instance, definition.getName(), firstStep.getName());
    }

    /**
     * Submit a decision (approve/reject) for the current step.
     */
    @Transactional
    public ApprovalInstanceResponse submitDecision(UUID instanceId, SubmitDecisionRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        ApprovalInstance instance = getInstanceOrThrow(instanceId);

        if (instance.getStatus() != ApprovalInstanceStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Невозможно принять решение: процесс согласования не активен (статус: " + instance.getStatus() + ")");
        }

        ApprovalDecisionType decisionType = ApprovalDecisionType.valueOf(request.decision().toUpperCase());

        UUID currentStepId = instance.getCurrentStepId();
        WorkflowStep currentStep = workflowStepRepository.findById(currentStepId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Шаг согласования не найден: " + currentStepId));

        // Record the decision
        ApprovalDecision decision = ApprovalDecision.builder()
                .approvalInstanceId(instance.getId())
                .workflowStepId(currentStep.getId())
                .stepOrder(instance.getCurrentStepOrder())
                .approverId(userId)
                .decision(decisionType)
                .comments(request.comments())
                .decidedAt(Instant.now())
                .build();
        approvalDecisionRepository.save(decision);

        String oldStatus = instance.getStatus().name();
        String stepName = currentStep.getName();
        String workflowName = "";

        if (decisionType == ApprovalDecisionType.APPROVED) {
            // Find next step
            List<WorkflowStep> allSteps = workflowStepRepository
                    .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(instance.getWorkflowDefinitionId());

            WorkflowStep nextStep = allSteps.stream()
                    .filter(s -> s.getSortOrder() != null
                            && currentStep.getSortOrder() != null
                            && s.getSortOrder() > currentStep.getSortOrder())
                    .min(Comparator.comparingInt(WorkflowStep::getSortOrder))
                    .orElse(null);

            if (nextStep == null) {
                // No more steps — fully approved
                instance.setStatus(ApprovalInstanceStatus.APPROVED);
                instance.setCompletedAt(Instant.now());
                log.info("Approval instance {} fully approved", instanceId);
            } else {
                // Advance to next step
                instance.setCurrentStepId(nextStep.getId());
                instance.setCurrentStepOrder(nextStep.getSortOrder() != null ? nextStep.getSortOrder() : 0);
                instance.setDelegatedTo(null); // Clear delegation on step advance

                // Reset SLA deadline
                if (nextStep.getSlaHours() != null && nextStep.getSlaHours() > 0) {
                    instance.setSlaDeadline(Instant.now().plus(nextStep.getSlaHours(), ChronoUnit.HOURS));
                } else {
                    instance.setSlaDeadline(null);
                }

                stepName = nextStep.getName();
                log.info("Approval instance {} advanced to step: {} (order={})",
                        instanceId, nextStep.getName(), nextStep.getSortOrder());
            }
        } else if (decisionType == ApprovalDecisionType.REJECTED) {
            instance.setStatus(ApprovalInstanceStatus.REJECTED);
            instance.setCompletedAt(Instant.now());
            log.info("Approval instance {} rejected at step: {}", instanceId, currentStep.getName());
        }

        instance = approvalInstanceRepository.save(instance);
        auditService.logStatusChange("ApprovalInstance", instance.getId(), oldStatus, instance.getStatus().name());

        // Resolve workflow name for response
        workflowName = resolveWorkflowName(instance.getWorkflowDefinitionId());
        return toResponse(instance, workflowName, stepName);
    }

    /**
     * Delegate the current approval step to another user.
     */
    @Transactional
    public ApprovalInstanceResponse delegate(UUID instanceId, UUID delegateToId, String comments) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        ApprovalInstance instance = getInstanceOrThrow(instanceId);

        if (instance.getStatus() != ApprovalInstanceStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Невозможно делегировать: процесс согласования не активен (статус: " + instance.getStatus() + ")");
        }

        UUID currentStepId = instance.getCurrentStepId();
        WorkflowStep currentStep = workflowStepRepository.findById(currentStepId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Шаг согласования не найден: " + currentStepId));

        // Record delegation decision
        ApprovalDecision decision = ApprovalDecision.builder()
                .approvalInstanceId(instance.getId())
                .workflowStepId(currentStep.getId())
                .stepOrder(instance.getCurrentStepOrder())
                .approverId(userId)
                .decision(ApprovalDecisionType.DELEGATED)
                .comments(comments)
                .decidedAt(Instant.now())
                .build();
        approvalDecisionRepository.save(decision);

        instance.setDelegatedTo(delegateToId);
        instance = approvalInstanceRepository.save(instance);

        auditService.logUpdate("ApprovalInstance", instance.getId(),
                "delegatedTo", null, delegateToId.toString());

        log.info("Approval instance {} delegated to user {} by user {}", instanceId, delegateToId, userId);

        String workflowName = resolveWorkflowName(instance.getWorkflowDefinitionId());
        return toResponse(instance, workflowName, currentStep.getName());
    }

    /**
     * Get full approval history for an entity.
     */
    @Transactional(readOnly = true)
    public List<ApprovalDecisionResponse> getHistory(UUID entityId, String entityType) {
        List<ApprovalInstance> instances = approvalInstanceRepository
                .findByEntityIdAndEntityTypeAndDeletedFalse(entityId, entityType);

        return instances.stream()
                .flatMap(inst -> approvalDecisionRepository
                        .findByApprovalInstanceIdAndDeletedFalse(inst.getId()).stream())
                .sorted(Comparator.comparing(
                        ApprovalDecision::getDecidedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDecisionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get pending approvals for the current user (inbox).
     */
    @Transactional(readOnly = true)
    public Page<ApprovalInstanceResponse> getPendingForUser(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        Page<ApprovalInstance> inProgressPage = approvalInstanceRepository
                .findByOrganizationIdAndStatusAndDeletedFalse(orgId, ApprovalInstanceStatus.IN_PROGRESS, pageable);

        // Filter instances where the current step's approverIds contains the user ID
        // or where the instance is delegated to the current user
        List<ApprovalInstanceResponse> filtered = inProgressPage.getContent().stream()
                .filter(inst -> isApproverForCurrentStep(inst, userId))
                .map(inst -> {
                    String workflowName = resolveWorkflowName(inst.getWorkflowDefinitionId());
                    String stepName = resolveStepName(inst.getCurrentStepId());
                    return toResponse(inst, workflowName, stepName);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    /**
     * Get a single approval instance by ID.
     */
    @Transactional(readOnly = true)
    public ApprovalInstanceResponse getInstance(UUID instanceId) {
        ApprovalInstance instance = getInstanceOrThrow(instanceId);
        String workflowName = resolveWorkflowName(instance.getWorkflowDefinitionId());
        String stepName = resolveStepName(instance.getCurrentStepId());
        return toResponse(instance, workflowName, stepName);
    }

    /**
     * Cancel an approval instance.
     */
    @Transactional
    public ApprovalInstanceResponse cancel(UUID instanceId) {
        ApprovalInstance instance = getInstanceOrThrow(instanceId);

        if (instance.getStatus() != ApprovalInstanceStatus.IN_PROGRESS
                && instance.getStatus() != ApprovalInstanceStatus.ESCALATED) {
            throw new IllegalStateException(
                    "Невозможно отменить: процесс согласования уже завершён (статус: " + instance.getStatus() + ")");
        }

        String oldStatus = instance.getStatus().name();
        instance.setStatus(ApprovalInstanceStatus.CANCELLED);
        instance.setCompletedAt(Instant.now());
        instance = approvalInstanceRepository.save(instance);

        auditService.logStatusChange("ApprovalInstance", instance.getId(), oldStatus, ApprovalInstanceStatus.CANCELLED.name());

        log.info("Approval instance {} cancelled", instanceId);

        String workflowName = resolveWorkflowName(instance.getWorkflowDefinitionId());
        String stepName = resolveStepName(instance.getCurrentStepId());
        return toResponse(instance, workflowName, stepName);
    }

    /**
     * Check for overdue approval instances and escalate them.
     * Intended to be called by a scheduler.
     */
    @Transactional
    public void escalateOverdue() {
        List<ApprovalInstance> overdue = approvalInstanceRepository
                .findByStatusAndSlaDeadlineBeforeAndDeletedFalse(ApprovalInstanceStatus.IN_PROGRESS, Instant.now());

        for (ApprovalInstance instance : overdue) {
            String oldStatus = instance.getStatus().name();
            instance.setStatus(ApprovalInstanceStatus.ESCALATED);
            approvalInstanceRepository.save(instance);

            auditService.logStatusChange("ApprovalInstance", instance.getId(),
                    oldStatus, ApprovalInstanceStatus.ESCALATED.name());

            log.warn("Approval instance {} escalated due to SLA breach (deadline was {})",
                    instance.getId(), instance.getSlaDeadline());

            // TODO: Send escalation notification
        }

        if (!overdue.isEmpty()) {
            log.info("Escalated {} overdue approval instances", overdue.size());
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    private ApprovalInstance getInstanceOrThrow(UUID instanceId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ApprovalInstance instance = approvalInstanceRepository.findById(instanceId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Процесс согласования не найден: " + instanceId));

        if (!instance.getOrganizationId().equals(orgId)) {
            throw new EntityNotFoundException("Процесс согласования не найден: " + instanceId);
        }

        return instance;
    }

    private boolean isApproverForCurrentStep(ApprovalInstance instance, UUID userId) {
        // Check delegation first
        if (userId.equals(instance.getDelegatedTo())) {
            return true;
        }

        if (instance.getCurrentStepId() == null) {
            return false;
        }

        return workflowStepRepository.findById(instance.getCurrentStepId())
                .filter(step -> !step.isDeleted())
                .map(step -> {
                    String approverIds = step.getApproverIds();
                    if (approverIds != null && approverIds.contains(userId.toString())) {
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }

    private String resolveWorkflowName(UUID workflowDefinitionId) {
        if (workflowDefinitionId == null) {
            return null;
        }
        return workflowDefinitionRepository.findById(workflowDefinitionId)
                .map(WorkflowDefinition::getName)
                .orElse(null);
    }

    private String resolveStepName(UUID stepId) {
        if (stepId == null) {
            return null;
        }
        return workflowStepRepository.findById(stepId)
                .map(WorkflowStep::getName)
                .orElse(null);
    }

    private ApprovalInstanceResponse toResponse(ApprovalInstance instance,
                                                 String workflowName,
                                                 String currentStepName) {
        boolean isOverdue = instance.getSlaDeadline() != null
                && instance.getStatus() == ApprovalInstanceStatus.IN_PROGRESS
                && Instant.now().isAfter(instance.getSlaDeadline());

        return new ApprovalInstanceResponse(
                instance.getId(),
                instance.getEntityId(),
                instance.getEntityType(),
                instance.getEntityNumber(),
                instance.getWorkflowDefinitionId(),
                workflowName,
                instance.getCurrentStepId(),
                currentStepName,
                instance.getCurrentStepOrder() != null ? instance.getCurrentStepOrder() : 0,
                instance.getStatus().name(),
                instance.getInitiatedById(),
                instance.getSlaDeadline(),
                isOverdue,
                instance.getEscalatedTo(),
                instance.getDelegatedTo(),
                instance.getNotes(),
                instance.getCreatedAt(),
                instance.getCompletedAt()
        );
    }

    private ApprovalDecisionResponse toDecisionResponse(ApprovalDecision decision) {
        String stepName = resolveStepName(decision.getWorkflowStepId());

        return new ApprovalDecisionResponse(
                decision.getId(),
                decision.getApprovalInstanceId(),
                decision.getWorkflowStepId(),
                stepName,
                decision.getStepOrder() != null ? decision.getStepOrder() : 0,
                decision.getApproverId(),
                decision.getDecision().name(),
                decision.getComments(),
                decision.getDecidedAt()
        );
    }
}
