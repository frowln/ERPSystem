package com.privod.platform.modules.ops.service;

import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class WorkOrderSpecification {

    private WorkOrderSpecification() {
    }

    public static Specification<WorkOrder> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<WorkOrder> hasProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<WorkOrder> hasStatus(WorkOrderStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<WorkOrder> hasPriority(WorkOrderPriority priority) {
        return (root, query, cb) -> {
            if (priority == null) return cb.conjunction();
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<WorkOrder> hasForeman(UUID foremanId) {
        return (root, query, cb) -> {
            if (foremanId == null) return cb.conjunction();
            return cb.equal(root.get("foremanId"), foremanId);
        };
    }
}
