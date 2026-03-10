package com.privod.platform.modules.analytics.web.dto;

public record ProgressPointResponse(
        String month,
        double planned,
        double actual
) {
}
