package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.domain.TaskVisibility;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String code,
        String title,
        String description,
        UUID projectId,
        String projectName,
        UUID parentTaskId,
        TaskStatus status,
        String statusDisplayName,
        TaskPriority priority,
        String priorityDisplayName,
        UUID assigneeId,
        String assigneeName,
        UUID reporterId,
        String reporterName,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        Integer progress,
        String wbsCode,
        Integer sortOrder,
        UUID specItemId,
        String tags,
        String notes,
        boolean overdue,
        TaskVisibility visibility,
        UUID delegatedToId,
        String delegatedToName,
        List<TaskCommentResponse> comments,
        List<TaskParticipantResponse> participants,
        Integer subtaskCount,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TaskResponse fromEntity(ProjectTask task) {
        return fromEntity(task, null, null, null, null);
    }

    public static TaskResponse fromEntity(ProjectTask task, List<TaskCommentResponse> comments) {
        return fromEntity(task, comments, null, null, null);
    }

    public static TaskResponse fromEntity(ProjectTask task, List<TaskCommentResponse> comments,
                                           List<TaskParticipantResponse> participants) {
        return fromEntity(task, comments, participants, null, null);
    }

    public static TaskResponse fromEntity(ProjectTask task, List<TaskCommentResponse> comments,
                                           List<TaskParticipantResponse> participants,
                                           String projectName, Integer subtaskCount) {
        return new TaskResponse(
                task.getId(),
                task.getCode(),
                task.getTitle(),
                task.getDescription(),
                task.getProjectId(),
                projectName,
                task.getParentTaskId(),
                task.getStatus(),
                task.getStatus().getDisplayName(),
                task.getPriority(),
                task.getPriority().getDisplayName(),
                task.getAssigneeId(),
                task.getAssigneeName(),
                task.getReporterId(),
                task.getReporterName(),
                task.getPlannedStartDate(),
                task.getPlannedEndDate(),
                task.getActualStartDate(),
                task.getActualEndDate(),
                task.getEstimatedHours(),
                task.getActualHours(),
                task.getProgress(),
                task.getWbsCode(),
                task.getSortOrder(),
                task.getSpecItemId(),
                task.getTags(),
                task.getNotes(),
                task.isOverdue(),
                task.getVisibility(),
                task.getDelegatedToId(),
                task.getDelegatedToName(),
                comments,
                participants,
                subtaskCount,
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getCreatedBy()
        );
    }
}
