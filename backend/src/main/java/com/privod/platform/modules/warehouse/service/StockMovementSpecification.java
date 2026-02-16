package com.privod.platform.modules.warehouse.service;

import com.privod.platform.modules.warehouse.domain.StockMovement;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public final class StockMovementSpecification {

    private StockMovementSpecification() {
    }

    public static Specification<StockMovement> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<StockMovement> hasStatus(StockMovementStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<StockMovement> hasMovementType(StockMovementType movementType) {
        return (root, query, cb) -> {
            if (movementType == null) return cb.conjunction();
            return cb.equal(root.get("movementType"), movementType);
        };
    }

    public static Specification<StockMovement> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<StockMovement> hasLocation(UUID locationId) {
        return (root, query, cb) -> {
            if (locationId == null) return cb.conjunction();
            return cb.or(
                    cb.equal(root.get("sourceLocationId"), locationId),
                    cb.equal(root.get("destinationLocationId"), locationId)
            );
        };
    }

    public static Specification<StockMovement> dateRange(LocalDate dateFrom, LocalDate dateTo) {
        return (root, query, cb) -> {
            if (dateFrom == null && dateTo == null) return cb.conjunction();
            if (dateFrom != null && dateTo != null) {
                return cb.between(root.get("movementDate"), dateFrom, dateTo);
            }
            if (dateFrom != null) {
                return cb.greaterThanOrEqualTo(root.get("movementDate"), dateFrom);
            }
            return cb.lessThanOrEqualTo(root.get("movementDate"), dateTo);
        };
    }
}
