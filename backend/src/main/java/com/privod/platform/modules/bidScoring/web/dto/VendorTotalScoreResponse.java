package com.privod.platform.modules.bidScoring.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record VendorTotalScoreResponse(
        UUID vendorId,
        String vendorName,
        BigDecimal totalWeightedScore
) {
}
