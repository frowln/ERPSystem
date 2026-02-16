package com.privod.platform.modules.hr.service;

import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class EmployeeSpecification {

    private EmployeeSpecification() {
    }

    public static Specification<Employee> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<Employee> hasStatus(EmployeeStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Employee> belongsToOrganization(UUID organizationId) {
        return (root, query, cb) -> {
            if (organizationId == null) return cb.conjunction();
            return cb.equal(root.get("organizationId"), organizationId);
        };
    }

    public static Specification<Employee> searchByNameOrNumber(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("fullName")), pattern),
                    cb.like(cb.lower(root.get("employeeNumber")), pattern),
                    cb.like(cb.lower(root.get("position")), pattern)
            );
        };
    }
}
