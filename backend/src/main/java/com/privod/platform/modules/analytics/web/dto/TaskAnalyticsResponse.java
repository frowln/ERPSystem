package com.privod.platform.modules.analytics.web.dto;

import java.util.Map;

public record TaskAnalyticsResponse(
        long totalTasks,
        long completedTasks,
        long inProgressTasks,
        long overdueTasks,
        double completionRate,
        double avgCompletionDays,
        Map<String, Long> tasksByStatus,
        Map<String, Long> tasksByPriority
) {
}
