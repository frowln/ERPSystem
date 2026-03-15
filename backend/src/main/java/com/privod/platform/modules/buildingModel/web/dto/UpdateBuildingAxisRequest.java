package com.privod.platform.modules.buildingModel.web.dto;

import java.math.BigDecimal;

public record UpdateBuildingAxisRequest(
        String axisType,
        String name,
        BigDecimal position
) {
}
