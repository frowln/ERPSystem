package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectMilestone;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MilestoneResponse(
        UUID id,
        UUID projectId,
        String name,
        LocalDate plannedDate,
        LocalDate actualDate,
        String status,
        Integer sequence,
        Boolean isKeyMilestone,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static MilestoneResponse fromEntity(ProjectMilestone m) {
        return new MilestoneResponse(
                m.getId(),
                m.getProjectId(),
                m.getName(),
                m.getPlannedDate(),
                m.getActualDate(),
                m.getStatus(),
                m.getSequence(),
                m.getIsKeyMilestone(),
                m.getNotes(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
