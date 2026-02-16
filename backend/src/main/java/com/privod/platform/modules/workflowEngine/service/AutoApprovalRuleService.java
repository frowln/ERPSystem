package com.privod.platform.modules.workflowEngine.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import com.privod.platform.modules.workflowEngine.domain.AutoApprovalRule;
import com.privod.platform.modules.workflowEngine.repository.AutoApprovalRuleRepository;
import com.privod.platform.modules.workflowEngine.web.dto.AutoApprovalRuleResponse;
import com.privod.platform.modules.workflowEngine.web.dto.CreateAutoApprovalRuleRequest;
import com.privod.platform.modules.workflowEngine.web.dto.UpdateAutoApprovalRuleRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoApprovalRuleService {

    private final AutoApprovalRuleRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AutoApprovalRuleResponse> findAll(String search,
                                                   ApprovalEntityType entityType,
                                                   Boolean isActive,
                                                   UUID organizationId,
                                                   UUID projectId,
                                                   Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access approval rules for another organization");
        }

        Specification<AutoApprovalRule> spec = Specification
                .where(AutoApprovalRuleSpecification.notDeleted())
                .and(AutoApprovalRuleSpecification.hasEntityType(entityType))
                .and(AutoApprovalRuleSpecification.isActive(isActive))
                .and(AutoApprovalRuleSpecification.belongsToOrganization(currentOrgId))
                .and(AutoApprovalRuleSpecification.belongsToProject(projectId))
                .and(AutoApprovalRuleSpecification.searchByName(search));

        return repository.findAll(spec, pageable).map(AutoApprovalRuleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AutoApprovalRuleResponse findById(UUID id) {
        AutoApprovalRule rule = getRuleOrThrow(id);
        return AutoApprovalRuleResponse.fromEntity(rule);
    }

    @Transactional
    public AutoApprovalRuleResponse create(CreateAutoApprovalRuleRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create approval rule for another organization");
        }

        AutoApprovalRule rule = AutoApprovalRule.builder()
                .name(request.name())
                .description(request.description())
                .entityType(request.entityType())
                .conditions(request.conditions())
                .autoApproveThreshold(request.autoApproveThreshold())
                .requiredApprovers(request.requiredApprovers() != null ? request.requiredApprovers() : 1)
                .escalationTimeoutHours(request.escalationTimeoutHours() != null ? request.escalationTimeoutHours() : 24)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .projectId(request.projectId())
                .organizationId(currentOrgId)
                .build();

        rule = repository.save(rule);
        auditService.logCreate("AutoApprovalRule", rule.getId());

        log.info("Auto-approval rule created: {} ({}) for entity type {}",
                rule.getName(), rule.getId(), rule.getEntityType());
        return AutoApprovalRuleResponse.fromEntity(rule);
    }

    @Transactional
    public AutoApprovalRuleResponse update(UUID id, UpdateAutoApprovalRuleRequest request) {
        AutoApprovalRule rule = getRuleOrThrow(id);
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        if (request.name() != null) {
            rule.setName(request.name());
        }
        if (request.description() != null) {
            rule.setDescription(request.description());
        }
        if (request.entityType() != null) {
            rule.setEntityType(request.entityType());
        }
        if (request.conditions() != null) {
            rule.setConditions(request.conditions());
        }
        if (request.autoApproveThreshold() != null) {
            rule.setAutoApproveThreshold(request.autoApproveThreshold());
        }
        if (request.requiredApprovers() != null) {
            rule.setRequiredApprovers(request.requiredApprovers());
        }
        if (request.escalationTimeoutHours() != null) {
            rule.setEscalationTimeoutHours(request.escalationTimeoutHours());
        }
        if (request.isActive() != null) {
            rule.setIsActive(request.isActive());
        }
        if (request.projectId() != null) {
            rule.setProjectId(request.projectId());
        }
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot move approval rule to another organization");
        }

        rule = repository.save(rule);
        auditService.logUpdate("AutoApprovalRule", rule.getId(), "multiple", null, null);

        log.info("Auto-approval rule updated: {} ({})", rule.getName(), rule.getId());
        return AutoApprovalRuleResponse.fromEntity(rule);
    }

    @Transactional
    public void delete(UUID id) {
        AutoApprovalRule rule = getRuleOrThrow(id);
        rule.softDelete();
        repository.save(rule);
        auditService.logDelete("AutoApprovalRule", id);
        log.info("Auto-approval rule soft-deleted: {} ({})", rule.getName(), id);
    }

    @Transactional
    public AutoApprovalRuleResponse toggleActive(UUID id) {
        AutoApprovalRule rule = getRuleOrThrow(id);
        boolean newState = !Boolean.TRUE.equals(rule.getIsActive());
        rule.setIsActive(newState);
        rule = repository.save(rule);
        auditService.logUpdate("AutoApprovalRule", rule.getId(), "isActive",
                String.valueOf(!newState), String.valueOf(newState));

        log.info("Auto-approval rule {} {}: ({})",
                newState ? "activated" : "deactivated", rule.getName(), rule.getId());
        return AutoApprovalRuleResponse.fromEntity(rule);
    }

    private AutoApprovalRule getRuleOrThrow(UUID id) {
        AutoApprovalRule rule = repository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Правило автоматического согласования не найдено: " + id));

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (rule.getOrganizationId() == null || !rule.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Правило автоматического согласования не найдено: " + id);
        }

        return rule;
    }
}
