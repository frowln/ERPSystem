package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Ks2PrintDataResponse(
        UUID id,
        String number,
        LocalDate documentDate,
        String name,
        UUID projectId,
        String projectName,
        UUID contractId,
        String contractNumber,
        String status,
        BigDecimal totalAmount,
        BigDecimal totalVatAmount,
        BigDecimal totalWithVat,
        List<Ks2PrintLineData> lines,
        String investorName,
        String contractorName,
        String subcontractorName,
        String constructionName,
        String constructionAddress
) {

    public record Ks2PrintLineData(
            int sequence,
            String name,
            String unitOfMeasure,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal amount,
            BigDecimal vatRate,
            BigDecimal vatAmount
    ) {
    }
}
