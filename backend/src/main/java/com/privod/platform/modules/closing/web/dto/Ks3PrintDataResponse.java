package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Ks3PrintDataResponse(
        UUID id,
        String number,
        LocalDate documentDate,
        String name,
        LocalDate periodFrom,
        LocalDate periodTo,
        UUID projectId,
        String projectName,
        UUID contractId,
        String contractNumber,
        String status,
        BigDecimal totalAmount,
        BigDecimal retentionPercent,
        BigDecimal retentionAmount,
        BigDecimal netAmount,
        List<Ks3PrintKs2Entry> linkedKs2,
        String investorName,
        String contractorName,
        String constructionName,
        String constructionAddress
) {

    public record Ks3PrintKs2Entry(
            UUID ks2Id,
            String ks2Number,
            LocalDate ks2Date,
            BigDecimal amount
    ) {
    }
}
