package com.privod.platform.modules.buildingModel.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBuildingRoomRequest(
        @NotNull UUID floorId,
        @NotBlank String name,
        String roomNumber,
        String roomType,
        BigDecimal area,
        String description
) {
}
