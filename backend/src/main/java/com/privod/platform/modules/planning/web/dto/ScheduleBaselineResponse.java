package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.BaselineType;
import com.privod.platform.modules.planning.domain.ScheduleBaseline;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ScheduleBaselineResponse(
        UUID id,
        UUID projectId,
        String name,
        BaselineType baselineType,
        String baselineTypeDisplayName,
        LocalDate baselineDate,
        String snapshotData,
        UUID createdById,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static ScheduleBaselineResponse fromEntity(ScheduleBaseline baseline) {
        return new ScheduleBaselineResponse(
                baseline.getId(),
                baseline.getProjectId(),
                baseline.getName(),
                baseline.getBaselineType(),
                baseline.getBaselineType().getDisplayName(),
                baseline.getBaselineDate(),
                baseline.getSnapshotData(),
                baseline.getCreatedById(),
                baseline.getNotes(),
                baseline.getCreatedAt(),
                baseline.getUpdatedAt()
        );
    }
}
