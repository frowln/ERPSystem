package com.privod.platform.modules.analytics.web.dto;

public record DataSourceInfo(
        String id,
        String label,
        String description,
        int fieldCount
) {
}
