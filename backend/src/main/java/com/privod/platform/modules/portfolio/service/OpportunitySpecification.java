package com.privod.platform.modules.portfolio.service;

import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class OpportunitySpecification {

    private OpportunitySpecification() {
    }

    public static Specification<Opportunity> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Opportunity> hasStage(OpportunityStage stage) {
        return (root, query, cb) -> {
            if (stage == null) return cb.conjunction();
            return cb.equal(root.get("stage"), stage);
        };
    }

    public static Specification<Opportunity> hasClientType(ClientType clientType) {
        return (root, query, cb) -> {
            if (clientType == null) return cb.conjunction();
            return cb.equal(root.get("clientType"), clientType);
        };
    }

    public static Specification<Opportunity> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<Opportunity> searchByName(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("clientName")), pattern)
            );
        };
    }
}
