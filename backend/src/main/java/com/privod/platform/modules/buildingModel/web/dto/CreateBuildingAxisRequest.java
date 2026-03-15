package com.privod.platform.modules.buildingModel.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBuildingAxisRequest(
        @NotNull UUID sectionId,
        @NotBlank String axisType,
        @NotBlank String name,
        BigDecimal position
) {
}
