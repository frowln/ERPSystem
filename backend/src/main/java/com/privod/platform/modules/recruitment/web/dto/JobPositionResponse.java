package com.privod.platform.modules.recruitment.web.dto;

import com.privod.platform.modules.recruitment.domain.JobPosition;
import com.privod.platform.modules.recruitment.domain.JobPositionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JobPositionResponse(
        UUID id,
        String name,
        UUID departmentId,
        String description,
        String requirements,
        int expectedEmployees,
        int hiredEmployees,
        JobPositionStatus status,
        String statusDisplayName,
        LocalDate deadline,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static JobPositionResponse fromEntity(JobPosition jp) {
        return new JobPositionResponse(
                jp.getId(),
                jp.getName(),
                jp.getDepartmentId(),
                jp.getDescription(),
                jp.getRequirements(),
                jp.getExpectedEmployees(),
                jp.getHiredEmployees(),
                jp.getStatus(),
                jp.getStatus().getDisplayName(),
                jp.getDeadline(),
                jp.getCreatedAt(),
                jp.getUpdatedAt(),
                jp.getCreatedBy()
        );
    }
}
