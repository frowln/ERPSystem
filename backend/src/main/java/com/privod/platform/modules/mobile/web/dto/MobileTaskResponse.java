package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskPriority;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MobileTaskResponse(
        UUID id,
        String title,
        String description,
        String status,
        String priority,
        UUID projectId,
        String projectName,
        UUID assignedToId,
        String assignedToName,
        LocalDate dueDate,
        LocalDate completedAt,
        String location,
        Instant createdAt
) {
    public static MobileTaskResponse fromEntity(ProjectTask task) {
        return fromEntity(task, null);
    }

    public static MobileTaskResponse fromEntity(ProjectTask task, String projectName) {
        String mobileStatus = mapToMobileStatus(task.getStatus().name());
        String mobilePriority = mapToMobilePriority(task.getPriority());

        return new MobileTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                mobileStatus,
                mobilePriority,
                task.getProjectId(),
                projectName,
                task.getAssigneeId(),
                task.getAssigneeName(),
                task.getPlannedEndDate(),
                task.getActualEndDate(),
                null,
                task.getCreatedAt()
        );
    }

    private static String mapToMobileStatus(String taskStatus) {
        return switch (taskStatus) {
            case "BACKLOG", "TODO" -> "ASSIGNED";
            case "IN_PROGRESS", "IN_REVIEW" -> "IN_PROGRESS";
            case "DONE" -> "COMPLETED";
            case "CANCELLED" -> "CANCELLED";
            default -> "ASSIGNED";
        };
    }

    private static String mapToMobilePriority(TaskPriority priority) {
        return switch (priority) {
            case LOW -> "LOW";
            case NORMAL -> "MEDIUM";
            case HIGH, URGENT, CRITICAL -> "HIGH";
        };
    }
}
