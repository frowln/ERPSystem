package com.privod.platform.modules.closing.service;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks3Document;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class ClosingDocumentSpecification {

    private ClosingDocumentSpecification() {
    }

    // KS-2 Specifications

    public static Specification<Ks2Document> ks2NotDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Ks2Document> ks2HasProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<Ks2Document> ks2HasContract(UUID contractId) {
        return (root, query, cb) -> {
            if (contractId == null) return cb.conjunction();
            return cb.equal(root.get("contractId"), contractId);
        };
    }

    public static Specification<Ks2Document> ks2HasStatus(ClosingDocumentStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    // KS-3 Specifications

    public static Specification<Ks3Document> ks3NotDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Ks3Document> ks3HasProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<Ks3Document> ks3HasContract(UUID contractId) {
        return (root, query, cb) -> {
            if (contractId == null) return cb.conjunction();
            return cb.equal(root.get("contractId"), contractId);
        };
    }

    public static Specification<Ks3Document> ks3HasStatus(ClosingDocumentStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }
}
