package com.privod.platform.modules.buildingModel.web.dto;

import com.privod.platform.modules.buildingModel.domain.BuildingRoom;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BuildingRoomResponse(
        UUID id,
        UUID floorId,
        UUID projectId,
        String name,
        String roomNumber,
        String roomType,
        BigDecimal area,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static BuildingRoomResponse fromEntity(BuildingRoom r) {
        return new BuildingRoomResponse(
                r.getId(),
                r.getFloorId(),
                r.getProjectId(),
                r.getName(),
                r.getRoomNumber(),
                r.getRoomType(),
                r.getArea(),
                r.getDescription(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
