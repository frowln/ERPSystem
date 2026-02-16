package com.privod.platform.modules.warehouse.service;

import com.privod.platform.modules.warehouse.domain.InventoryCheck;
import com.privod.platform.modules.warehouse.domain.InventoryCheckStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class InventoryCheckSpecification {

    private InventoryCheckSpecification() {
    }

    public static Specification<InventoryCheck> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<InventoryCheck> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> cb.equal(root.get("organizationId"), organizationId);
    }

    public static Specification<InventoryCheck> hasStatus(InventoryCheckStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<InventoryCheck> hasLocation(UUID locationId) {
        return (root, query, cb) -> {
            if (locationId == null) return cb.conjunction();
            return cb.equal(root.get("locationId"), locationId);
        };
    }
}
