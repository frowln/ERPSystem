package com.privod.platform.modules.task.service;

import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class TaskSpecification {

    private TaskSpecification() {
    }

    public static Specification<ProjectTask> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("deleted"), false);
    }

    public static Specification<ProjectTask> belongsToProject(UUID projectId) {
        return (root, query, cb) -> {
            if (projectId == null) return cb.conjunction();
            return cb.equal(root.get("projectId"), projectId);
        };
    }

    public static Specification<ProjectTask> hasStatus(TaskStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<ProjectTask> hasPriority(TaskPriority priority) {
        return (root, query, cb) -> {
            if (priority == null) return cb.conjunction();
            return cb.equal(root.get("priority"), priority);
        };
    }

    public static Specification<ProjectTask> assignedTo(UUID assigneeId) {
        return (root, query, cb) -> {
            if (assigneeId == null) return cb.conjunction();
            return cb.equal(root.get("assigneeId"), assigneeId);
        };
    }

    public static Specification<ProjectTask> hasParentTask(UUID parentTaskId) {
        return (root, query, cb) -> {
            if (parentTaskId == null) return cb.conjunction();
            return cb.equal(root.get("parentTaskId"), parentTaskId);
        };
    }
}
