package com.privod.platform.modules.analytics.web.dto;

public record KpiItemResponse(
        String id,
        String name,
        String description,
        double target,
        double actual,
        String unit,
        String trend,
        String trendValue,
        String category,
        String targetDirection,
        String createdAt,
        String updatedAt
) {
}
