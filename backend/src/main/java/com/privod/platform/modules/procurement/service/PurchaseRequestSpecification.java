package com.privod.platform.modules.procurement.service;

import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class PurchaseRequestSpecification {

    private PurchaseRequestSpecification() {
    }

    public static Specification<PurchaseRequest> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<PurchaseRequest> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> cb.equal(root.get("organizationId"), organizationId);
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

    public static Specification<PurchaseRequest> hasStatuses(List<PurchaseRequestStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return cb.conjunction();
            }
            return root.get("status").in(statuses);
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

    public static Specification<PurchaseRequest> requestedBy(UUID requestedById) {
        return (root, query, cb) -> {
            if (requestedById == null) return cb.conjunction();
            return cb.equal(root.get("requestedById"), requestedById);
        };
    }

    public static Specification<PurchaseRequest> quickSearch(String rawSearch) {
        String normalized = rawSearch.trim().toLowerCase();
        String pattern = "%" + normalized + "%";
        UUID parsedUuid = tryParseUuid(rawSearch);

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("name").as(String.class)), pattern));
            predicates.add(cb.like(cb.lower(root.get("requestedByName").as(String.class)), pattern));
            predicates.add(cb.like(cb.lower(root.get("notes").as(String.class)), pattern));
            predicates.add(cb.like(cb.lower(root.get("status").as(String.class)), pattern));
            predicates.add(cb.like(cb.lower(root.get("priority").as(String.class)), pattern));

            if (parsedUuid != null) {
                predicates.add(cb.equal(root.get("projectId"), parsedUuid));
                predicates.add(cb.equal(root.get("requestedById"), parsedUuid));
                predicates.add(cb.equal(root.get("assignedToId"), parsedUuid));
                predicates.add(cb.equal(root.get("contractId"), parsedUuid));
                predicates.add(cb.equal(root.get("specificationId"), parsedUuid));
            }

            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    private static UUID tryParseUuid(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
