package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record ResourceUtilizationDto(
        long totalWorkers,
        long allocatedWorkers,
        BigDecimal workerUtilizationPercent,
        long totalEquipment,
        long allocatedEquipment,
        BigDecimal equipmentUtilizationPercent
) {
}
