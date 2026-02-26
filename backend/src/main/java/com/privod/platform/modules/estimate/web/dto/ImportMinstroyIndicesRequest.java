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

    public String normalizedQuarter() {
        if (quarter == null || quarter.isBlank()) {
            return quarter;
        }
        String normalized = quarter.trim().toUpperCase();
        if (normalized.matches("\\d{4}-Q[1-4]")) {
            return normalized;
        }
        if (normalized.matches("\\d{4}/Q[1-4]")) {
            return normalized.replace('/', '-');
        }
        if (normalized.matches("[1-4]Q\\d{4}")) {
            return normalized.substring(2) + "-Q" + normalized.charAt(0);
        }
        if (normalized.matches("\\d{4}[- ]?[1-4]")) {
            return normalized.substring(0, 4) + "-Q" + normalized.charAt(normalized.length() - 1);
        }
        return normalized;
    }
}
