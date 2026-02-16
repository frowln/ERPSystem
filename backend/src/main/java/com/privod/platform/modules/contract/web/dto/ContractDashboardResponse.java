package com.privod.platform.modules.contract.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ContractDashboardResponse(
        long totalContracts,
        Map<String, Long> statusCounts,
        BigDecimal totalAmount
) {
}
