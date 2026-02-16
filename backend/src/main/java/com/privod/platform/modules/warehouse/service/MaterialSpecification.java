package com.privod.platform.modules.warehouse.service;

import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import org.springframework.data.jpa.domain.Specification;

public final class MaterialSpecification {

    private MaterialSpecification() {
    }

    public static Specification<Material> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Material> hasCategory(MaterialCategory category) {
        return (root, query, cb) -> {
            if (category == null) return cb.conjunction();
            return cb.equal(root.get("category"), category);
        };
    }

    public static Specification<Material> searchByNameOrCode(String search) {
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
