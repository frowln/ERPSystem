package com.privod.platform.modules.procurement.service;

import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class PurchaseRequestSpecification {

    private PurchaseRequestSpecification() {
    }

    public static Specification<PurchaseRequest> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<PurchaseRequest> hasProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<PurchaseRequest> hasStatus(PurchaseRequestStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<PurchaseRequest> hasPriority(PurchaseRequestPriority priority) {
        return (root, query, cb) -> {
            if (priority == null) return cb.conjunction();
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<PurchaseRequest> assignedTo(UUID assignedToId) {
        return (root, query, cb) -> {
            if (assignedToId == null) return cb.conjunction();
            return cb.equal(root.get("assignedToId"), assignedToId);
        };
    }
}
