package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.modules.changeManagement.domain.ChangeEvent;
import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class ChangeEventSpecification {

    private ChangeEventSpecification() {
    }

    public static Specification<ChangeEvent> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<ChangeEvent> hasStatus(ChangeEventStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<ChangeEvent> hasSource(ChangeEventSource source) {
        return (root, query, cb) -> {
            if (source == null) return cb.conjunction();
            return cb.equal(root.get("source"), source);
        };
    }

    public static Specification<ChangeEvent> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<ChangeEvent> searchByTitleOrNumber(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("number")), pattern)
            );
        };
    }
}
