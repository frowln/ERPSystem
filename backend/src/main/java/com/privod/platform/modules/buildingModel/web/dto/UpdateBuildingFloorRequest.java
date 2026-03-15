package com.privod.platform.modules.buildingModel.web.dto;

import java.math.BigDecimal;

public record UpdateBuildingFloorRequest(
        String name,
        Integer floorNumber,
        BigDecimal elevation,
        BigDecimal area
) {
}
