package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GanttTaskResponse(
        UUID id,
        String code,
        String title,
        UUID parentTaskId,
        TaskStatus status,
        String statusDisplayName,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        Integer progress,
        String wbsCode,
        String assigneeName,
        List<TaskDependencyResponse> dependencies
) {
    public static GanttTaskResponse fromEntity(ProjectTask task, List<TaskDependencyResponse> dependencies) {
        return new GanttTaskResponse(
                task.getId(),
                task.getCode(),
                task.getTitle(),
                task.getParentTaskId(),
                task.getStatus(),
                task.getStatus().getDisplayName(),
                task.getPlannedStartDate(),
                task.getPlannedEndDate(),
                task.getActualStartDate(),
                task.getActualEndDate(),
                task.getProgress(),
                task.getWbsCode(),
                task.getAssigneeName(),
                dependencies
        );
    }
}
