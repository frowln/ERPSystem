package com.privod.platform.modules.estimate.web.dto;

public record MinstroyIndexResponse(
        String region,
        int quarter,
        int year,
        String indexType,
        double value
) {
}
