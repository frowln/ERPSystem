package com.privod.platform.modules.workflowEngine.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.workflowEngine.domain.AutomationExecution;
import com.privod.platform.modules.workflowEngine.domain.WorkflowDefinition;
import com.privod.platform.modules.workflowEngine.domain.WorkflowStep;
import com.privod.platform.modules.workflowEngine.repository.AutomationExecutionRepository;
import com.privod.platform.modules.workflowEngine.repository.WorkflowDefinitionRepository;
import com.privod.platform.modules.workflowEngine.repository.WorkflowStepRepository;
import com.privod.platform.modules.workflowEngine.web.dto.AutomationExecutionResponse;
import com.privod.platform.modules.workflowEngine.web.dto.CreateWorkflowDefinitionRequest;
import com.privod.platform.modules.workflowEngine.web.dto.CreateWorkflowStepRequest;
import com.privod.platform.modules.workflowEngine.web.dto.UpdateWorkflowDefinitionRequest;
import com.privod.platform.modules.workflowEngine.web.dto.WorkflowDefinitionResponse;
import com.privod.platform.modules.workflowEngine.web.dto.WorkflowStepResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowDefinitionService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final AutomationExecutionRepository automationExecutionRepository;

    @Transactional(readOnly = true)
    public Page<WorkflowDefinitionResponse> findAll(String search, String entityType,
                                                     Boolean isActive, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Page<WorkflowDefinition> page = workflowDefinitionRepository
                .findByOrganizationIdAndDeletedFalse(orgId, pageable);

        return page.map(def -> {
            long stepsCount = workflowStepRepository
                    .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(def.getId())
                    .size();
            return toResponse(def, (int) stepsCount);
        });
    }

    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse findById(UUID id) {
        WorkflowDefinition def = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Рабочий процесс не найден: " + id));
        int stepsCount = workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(def.getId())
                .size();
        return toResponse(def, stepsCount);
    }

    @Transactional
    public WorkflowDefinitionResponse create(CreateWorkflowDefinitionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .name(request.name())
                .description(request.description())
                .entityType(request.entityType())
                .isActive(request.isActive() != null ? request.isActive() : false)
                .organizationId(orgId)
                .createdById(userId)
                .build();

        def = workflowDefinitionRepository.save(def);
        return toResponse(def, 0);
    }

    @Transactional
    public WorkflowDefinitionResponse update(UUID id, UpdateWorkflowDefinitionRequest request) {
        WorkflowDefinition def = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Рабочий процесс не найден: " + id));

        if (request.name() != null) def.setName(request.name());
        if (request.description() != null) def.setDescription(request.description());
        if (request.entityType() != null) def.setEntityType(request.entityType());
        if (request.isActive() != null) def.setIsActive(request.isActive());

        def = workflowDefinitionRepository.save(def);
        int stepsCount = workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(def.getId())
                .size();
        return toResponse(def, stepsCount);
    }

    @Transactional
    public void delete(UUID id) {
        WorkflowDefinition def = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Рабочий процесс не найден: " + id));
        def.setDeleted(true);
        workflowDefinitionRepository.save(def);
    }

    @Transactional
    public WorkflowDefinitionResponse toggleActive(UUID id) {
        WorkflowDefinition def = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Рабочий процесс не найден: " + id));
        def.setIsActive(!Boolean.TRUE.equals(def.getIsActive()));
        def = workflowDefinitionRepository.save(def);
        int stepsCount = workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(def.getId())
                .size();
        return toResponse(def, stepsCount);
    }

    // ---- Steps ----

    @Transactional(readOnly = true)
    public List<WorkflowStepResponse> getSteps(UUID workflowDefinitionId) {
        return workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(workflowDefinitionId)
                .stream()
                .map(WorkflowStepResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<WorkflowStepResponse> replaceSteps(UUID workflowDefinitionId,
                                                    List<CreateWorkflowStepRequest> requests) {
        // Soft-delete existing steps
        List<WorkflowStep> existing = workflowStepRepository
                .findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(workflowDefinitionId);
        existing.forEach(s -> s.setDeleted(true));
        workflowStepRepository.saveAll(existing);

        // Create new steps
        List<WorkflowStep> newSteps = requests.stream().map(req -> WorkflowStep.builder()
                .workflowDefinitionId(workflowDefinitionId)
                .name(req.name())
                .description(req.description())
                .actionType(req.actionType())
                .actionConfig(req.actionConfig())
                .fromStatus(req.fromStatus())
                .toStatus(req.toStatus())
                .requiredRole(req.requiredRole())
                .approverIds(req.approverIds())
                .slaHours(req.slaHours())
                .sortOrder(req.sortOrder())
                .conditions(req.conditions())
                .build()
        ).toList();

        newSteps = workflowStepRepository.saveAll(newSteps);
        return newSteps.stream().map(WorkflowStepResponse::fromEntity).toList();
    }

    // ---- Automation executions ----

    @Transactional(readOnly = true)
    public Page<AutomationExecutionResponse> getExecutions(UUID ruleId, Pageable pageable) {
        Page<AutomationExecution> page;
        if (ruleId != null) {
            page = automationExecutionRepository.findByAutomationRuleIdAndDeletedFalse(ruleId, pageable);
        } else {
            page = automationExecutionRepository.findAll(pageable);
        }
        return page.map(AutomationExecutionResponse::fromEntity);
    }

    // ---- Helper ----

    private WorkflowDefinitionResponse toResponse(WorkflowDefinition def, int stepsCount) {
        return new WorkflowDefinitionResponse(
                def.getId(),
                def.getName(),
                def.getDescription(),
                def.getEntityType(),
                def.getIsActive(),
                def.getOrganizationId(),
                def.getCreatedById(),
                def.getCreatedAt(),
                def.getUpdatedAt()
        );
    }
}
