package com.privod.platform.modules.buildingModel.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBuildingFloorRequest(
        @NotNull UUID sectionId,
        @NotBlank String name,
        Integer floorNumber,
        BigDecimal elevation,
        BigDecimal area
) {
}
