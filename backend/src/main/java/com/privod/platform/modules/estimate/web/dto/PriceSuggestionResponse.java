package com.privod.platform.modules.estimate.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record PriceSuggestionResponse(
        BigDecimal avgPrice,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal medianPrice,
        Integer matchCount,
        List<MatchItem> recentMatches
) {
    public record MatchItem(String name, BigDecimal unitPrice, BigDecimal quantity, String projectName) {}
}
