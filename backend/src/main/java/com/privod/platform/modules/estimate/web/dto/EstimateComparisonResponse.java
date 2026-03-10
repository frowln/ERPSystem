package com.privod.platform.modules.estimate.web.dto;

import java.util.List;

public record EstimateComparisonResponse(
        List<ComparisonSection> sections,
        double totalPlan,
        double totalFact,
        double totalVariance
) {
    public record ComparisonSection(
            String name,
            List<ComparisonItem> items
    ) {}

    public record ComparisonItem(
            String name,
            String unit,
            double planQty,
            double planPrice,
            double planTotal,
            double factQty,
            double factPrice,
            double factTotal,
            double variance,
            double variancePercent
    ) {}
}
