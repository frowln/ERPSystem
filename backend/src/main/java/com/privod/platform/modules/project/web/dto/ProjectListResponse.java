package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectListResponse(
        UUID id,
        String code,
        String name,
        ProjectStatus status,
        String statusDisplayName,
        UUID managerId,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        String city,
        BigDecimal budgetAmount,
        ProjectType type,
        ProjectPriority priority
) {
    public static ProjectListResponse fromEntity(Project project) {
        return new ProjectListResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getStatus(),
                project.getStatus().getDisplayName(),
                project.getManagerId(),
                project.getPlannedStartDate(),
                project.getPlannedEndDate(),
                project.getCity(),
                project.getBudgetAmount(),
                project.getType(),
                project.getPriority()
        );
    }
}
