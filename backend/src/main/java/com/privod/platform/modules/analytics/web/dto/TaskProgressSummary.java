package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.util.Map;

public record TaskProgressSummary(
        long totalTasks,
        Map<String, Long> byStatus,
        Map<String, Long> byAssignee,
        BigDecimal completionPercent,
        long overdueTasks
) {
}
