package com.privod.platform.modules.bidScoring.web.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateBidComparisonRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String title,

        String description,

        @Size(max = 100)
        String rfqNumber,

        String category,

        UUID winnerVendorId,

        String winnerJustification
) {
}
