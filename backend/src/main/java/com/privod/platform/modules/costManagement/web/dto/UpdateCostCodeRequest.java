package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CostCodeLevel;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateCostCodeRequest(
        String code,
        String name,
        String description,
        UUID parentId,
        CostCodeLevel level,
        BigDecimal budgetAmount,
        Boolean isActive
) {
}
