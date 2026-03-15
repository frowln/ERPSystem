package com.privod.platform.modules.buildingModel.web.dto;

import com.privod.platform.modules.buildingModel.domain.BuildingSection;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BuildingSectionResponse(
        UUID id,
        UUID projectId,
        String name,
        String code,
        Integer sectionOrder,
        Integer floorCount,
        String description,
        List<BuildingFloorResponse> floors,
        List<BuildingAxisResponse> axes,
        Instant createdAt,
        Instant updatedAt
) {
    public static BuildingSectionResponse fromEntity(BuildingSection s) {
        return new BuildingSectionResponse(
                s.getId(),
                s.getProjectId(),
                s.getName(),
                s.getCode(),
                s.getSectionOrder(),
                s.getFloorCount(),
                s.getDescription(),
                null,
                null,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    public static BuildingSectionResponse fromEntity(BuildingSection s,
                                                     List<BuildingFloorResponse> floors,
                                                     List<BuildingAxisResponse> axes) {
        return new BuildingSectionResponse(
                s.getId(),
                s.getProjectId(),
                s.getName(),
                s.getCode(),
                s.getSectionOrder(),
                s.getFloorCount(),
                s.getDescription(),
                floors,
                axes,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
