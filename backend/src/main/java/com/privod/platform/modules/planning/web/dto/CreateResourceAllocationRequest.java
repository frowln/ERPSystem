package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.ResourceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateResourceAllocationRequest(
        @NotNull(message = "ID узла WBS обязателен")
        UUID wbsNodeId,

        ResourceType resourceType,
        UUID resourceId,

        @Size(max = 500, message = "Наименование ресурса не должно превышать 500 символов")
        String resourceName,

        BigDecimal plannedUnits,
        BigDecimal actualUnits,
        BigDecimal unitRate,
        BigDecimal plannedCost,
        BigDecimal actualCost,
        LocalDate startDate,
        LocalDate endDate
) {
}
