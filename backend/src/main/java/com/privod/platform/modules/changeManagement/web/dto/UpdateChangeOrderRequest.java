package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderType;

import java.math.BigDecimal;

public record UpdateChangeOrderRequest(
        String title,
        String description,
        ChangeOrderType changeOrderType,
        BigDecimal originalContractAmount,
        Integer scheduleImpactDays
) {
}
