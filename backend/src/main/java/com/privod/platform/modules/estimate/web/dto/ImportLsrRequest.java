package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ImportLsrRequest(
        String projectId,
        String estimateId,
        String estimateName,
        @NotEmpty @Valid List<ImportLsrLineDto> lines,
        @NotNull @Valid ImportLsrSummaryDto summary,
        @NotNull @Valid ImportLsrOptionsDto options
) {

    public record ImportLsrLineDto(
            int lineNumber,
            String lineType,
            String positionType,
            String resourceType,
            String justification,
            String name,
            String unit,
            BigDecimal quantity,
            BigDecimal baseCost,
            BigDecimal indexValue,
            BigDecimal currentCost,
            BigDecimal totalAmount,
            String coefficients,
            String sectionName,
            int depth,
            Integer parentLineNumber
    ) {}

    public record ImportLsrSummaryDto(
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
    ) {}

    public record ImportLsrOptionsDto(
            boolean autoLinkSpec,
            boolean autoPushFm,
            boolean autoPushMaterials,
            String budgetId
    ) {}
}
