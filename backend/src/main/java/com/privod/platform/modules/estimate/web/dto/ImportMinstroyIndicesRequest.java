package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record ImportMinstroyIndicesRequest(
        @NotBlank String quarter,
        String source,
        @NotEmpty List<IndexEntry> entries
) {
    public record IndexEntry(
            String region,
            String workType,
            String baseQuarter,
            BigDecimal indexValue
    ) {
    }
}
