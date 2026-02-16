package com.privod.platform.modules.warehouse.service;

import com.privod.platform.modules.warehouse.domain.WarehouseLocation;
import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class WarehouseLocationSpecification {

    private WarehouseLocationSpecification() {
    }

    public static Specification<WarehouseLocation> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<WarehouseLocation> hasLocationType(WarehouseLocationType locationType) {
        return (root, query, cb) -> {
            if (locationType == null) return cb.conjunction();
            return cb.equal(root.get("locationType"), locationType);
        };
    }

    public static Specification<WarehouseLocation> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<WarehouseLocation> searchByNameOrCode(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("code")), pattern)
            );
        };
    }
}
