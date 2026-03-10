package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record CashFlowChartResponse(
        List<String> labels,
        List<BigDecimal> inflows,
        List<BigDecimal> outflows
) {
}
