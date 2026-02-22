package com.privod.platform.modules.ai.web.dto;

public record AiUsageSummaryResponse(
        long totalConversations,
        long totalTokens,
        double totalCostRub,
        double avgResponseTimeMs
) {
}
