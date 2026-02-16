package com.privod.platform.modules.project.service;

import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class ProjectSpecification {

    private ProjectSpecification() {
    }

    public static Specification<Project> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Project> hasStatus(ProjectStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Project> hasType(ProjectType type) {
        return (root, query, cb) -> {
            if (type == null) return cb.conjunction();
            return cb.equal(root.get("type"), type);
        };
    }

    public static Specification<Project> hasPriority(ProjectPriority priority) {
        return (root, query, cb) -> {
            if (priority == null) return cb.conjunction();
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<Project> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<Project> managedBy(UUID managerId) {
        return (root, query, cb) -> {
            if (managerId == null) return cb.conjunction();
            return cb.equal(root.get("managerId"), managerId);
        };
    }

    public static Specification<Project> searchByNameOrCode(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("code")), pattern)
            );
        };
    }

    public static Specification<Project> inCity(String city) {
        return (root, query, cb) -> {
            if (city == null || city.isBlank()) return cb.conjunction();
            return cb.equal(cb.lower(root.get("city")), city.toLowerCase());
        };
    }
}
