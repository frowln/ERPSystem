package com.privod.platform.modules.buildingModel.web.dto;

import com.privod.platform.modules.buildingModel.domain.BuildingFloor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BuildingFloorResponse(
        UUID id,
        UUID sectionId,
        UUID projectId,
        String name,
        Integer floorNumber,
        BigDecimal elevation,
        BigDecimal area,
        List<BuildingRoomResponse> rooms,
        Instant createdAt,
        Instant updatedAt
) {
    public static BuildingFloorResponse fromEntity(BuildingFloor f) {
        return new BuildingFloorResponse(
                f.getId(),
                f.getSectionId(),
                f.getProjectId(),
                f.getName(),
                f.getFloorNumber(),
                f.getElevation(),
                f.getArea(),
                null,
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }

    public static BuildingFloorResponse fromEntity(BuildingFloor f, List<BuildingRoomResponse> rooms) {
        return new BuildingFloorResponse(
                f.getId(),
                f.getSectionId(),
                f.getProjectId(),
                f.getName(),
                f.getFloorNumber(),
                f.getElevation(),
                f.getArea(),
                rooms,
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }
}
