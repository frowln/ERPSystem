package com.privod.platform.modules.report.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * P2-DOC-2: KS-3 data payload for frontend print template (Ks3PrintTemplate.tsx).
 */
public record Ks3ExportResponse(
        UUID id,
        String number,
        String documentDate,
        String name,
        String periodFrom,
        String periodTo,
        String projectName,
        String contractorName,
        String clientName,
        String statusCode,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal retentionPercent,
        BigDecimal retentionAmount,
        BigDecimal netAmount,
        String notes,
        String createdBy,
        String createdAt,
        List<LinkedKs2Item> linkedKs2
) {
    public record LinkedKs2Item(
            UUID id,
            String number,
            String name,
            String documentDate,
            BigDecimal totalAmount
    ) {}
}
