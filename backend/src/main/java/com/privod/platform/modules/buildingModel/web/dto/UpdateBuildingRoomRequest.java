package com.privod.platform.modules.buildingModel.web.dto;

import java.math.BigDecimal;

public record UpdateBuildingRoomRequest(
        String name,
        String roomNumber,
        String roomType,
        BigDecimal area,
        String description
) {
}
