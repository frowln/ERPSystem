package com.privod.platform.modules.contract.service;

import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class ContractSpecification {

    private ContractSpecification() {
    }

    public static Specification<Contract> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Contract> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<Contract> hasStatus(ContractStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Contract> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<Contract> hasPartner(UUID partnerId) {
        return (root, query, cb) -> {
            if (partnerId == null) return cb.conjunction();
            return cb.equal(root.get("partnerId"), partnerId);
        };
    }

    public static Specification<Contract> searchByNameOrNumber(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("number")), pattern)
            );
        };
    }
}
