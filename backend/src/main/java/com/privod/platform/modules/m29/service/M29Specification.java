package com.privod.platform.modules.m29.service;

import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Status;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class M29Specification {

    private M29Specification() {
    }

    public static Specification<M29Document> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<M29Document> hasProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<M29Document> hasStatus(M29Status status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }
}
