package com.privod.platform.modules.task.web.dto;

import java.util.Map;

public record TaskSummaryResponse(
        long totalTasks,
        Map<String, Long> statusCounts,
        Map<String, Long> priorityCounts,
        Map<String, Long> assigneeCounts
) {
}
