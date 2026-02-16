package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class RevenueContractSpecification {

    private RevenueContractSpecification() {
    }

    public static Specification<RevenueContract> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<RevenueContract> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<RevenueContract> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<RevenueContract> hasMethod(RecognitionMethod method) {
        return (root, query, cb) -> {
            if (method == null) return cb.conjunction();
            return cb.equal(root.get("recognitionMethod"), method);
        };
    }

    public static Specification<RevenueContract> hasStandard(RecognitionStandard standard) {
        return (root, query, cb) -> {
            if (standard == null) return cb.conjunction();
            return cb.equal(root.get("recognitionStandard"), standard);
        };
    }

    public static Specification<RevenueContract> isActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) return cb.conjunction();
            return cb.equal(root.get("isActive"), active);
        };
    }

    public static Specification<RevenueContract> searchByContractName(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("contractName")), pattern);
        };
    }
}
