package com.privod.platform.modules.document.service;

import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class DocumentSpecification {

    private DocumentSpecification() {
    }

    public static Specification<Document> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Document> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<Document> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<Document> hasCategory(DocumentCategory category) {
        return (root, query, cb) -> {
            if (category == null) return cb.conjunction();
            return cb.equal(root.get("category"), category);
        };
    }

    public static Specification<Document> hasStatus(DocumentStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Document> searchByTitleOrDescription(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("tags")), pattern)
            );
        };
    }
}
