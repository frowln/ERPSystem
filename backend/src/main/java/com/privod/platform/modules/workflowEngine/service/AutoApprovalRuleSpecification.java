package com.privod.platform.modules.workflowEngine.service;

import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import com.privod.platform.modules.workflowEngine.domain.AutoApprovalRule;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class AutoApprovalRuleSpecification {

    private AutoApprovalRuleSpecification() {
    }

    public static Specification<AutoApprovalRule> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    public static Specification<AutoApprovalRule> hasEntityType(ApprovalEntityType entityType) {
        if (entityType == null) return null;
        return (root, query, cb) -> cb.equal(root.get("entityType"), entityType);
    }

    public static Specification<AutoApprovalRule> isActive(Boolean active) {
        if (active == null) return null;
        return (root, query, cb) -> cb.equal(root.get("isActive"), active);
    }

    public static Specification<AutoApprovalRule> belongsToOrganization(UUID organizationId) {
        if (organizationId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("organizationId"), organizationId);
    }

    public static Specification<AutoApprovalRule> belongsToProject(UUID projectId) {
        if (projectId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("projectId"), projectId);
    }

    public static Specification<AutoApprovalRule> searchByName(String search) {
        if (search == null || search.isBlank()) return null;
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }
}
