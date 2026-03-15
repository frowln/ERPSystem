package com.privod.platform.modules.buildingModel.web.dto;

import com.privod.platform.modules.buildingModel.domain.BuildingAxis;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BuildingAxisResponse(
        UUID id,
        UUID sectionId,
        UUID projectId,
        String axisType,
        String name,
        BigDecimal position,
        Instant createdAt,
        Instant updatedAt
) {
    public static BuildingAxisResponse fromEntity(BuildingAxis a) {
        return new BuildingAxisResponse(
                a.getId(),
                a.getSectionId(),
                a.getProjectId(),
                a.getAxisType(),
                a.getName(),
                a.getPosition(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
