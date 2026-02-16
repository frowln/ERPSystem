package com.privod.platform.modules.support.web.dto;

import java.util.Map;

public record TicketDashboardResponse(
        long totalTickets,
        long openTickets,
        Map<String, Long> statusCounts,
        Map<String, Long> priorityCounts
) {
}
