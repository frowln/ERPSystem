package com.privod.platform.modules.quality.web.dto;

import java.util.List;

public record DefectStatisticsResponse(
        List<TypeCount> byType,
        List<SeverityCount> bySeverity,
        long total
) {
    public record TypeCount(String type, long count, double percentage) {
    }

    public record SeverityCount(String severity, long count) {
    }
}
