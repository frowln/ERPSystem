package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.LocalEstimateSummary;

import java.math.BigDecimal;
import java.util.UUID;

public record LocalEstimateSummaryResponse(
        UUID id,
        UUID estimateId,
        BigDecimal directCostsTotal,
        BigDecimal overheadTotal,
        BigDecimal profitTotal,
        BigDecimal subtotal,
        BigDecimal winterSurcharge,
        BigDecimal winterSurchargeRate,
        BigDecimal tempStructures,
        BigDecimal tempStructuresRate,
        BigDecimal contingency,
        BigDecimal contingencyRate,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal grandTotal
) {
    public static LocalEstimateSummaryResponse fromEntity(LocalEstimateSummary entity) {
        return new LocalEstimateSummaryResponse(
                entity.getId(),
                entity.getEstimateId(),
                entity.getDirectCostsTotal(),
                entity.getOverheadTotal(),
                entity.getProfitTotal(),
                entity.getSubtotal(),
                entity.getWinterSurcharge(),
                entity.getWinterSurchargeRate(),
                entity.getTempStructures(),
                entity.getTempStructuresRate(),
                entity.getContingency(),
                entity.getContingencyRate(),
                entity.getVatRate(),
                entity.getVatAmount(),
                entity.getGrandTotal()
        );
    }
}
