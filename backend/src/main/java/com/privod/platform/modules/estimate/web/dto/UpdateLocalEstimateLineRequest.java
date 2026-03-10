package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateLocalEstimateLineRequest(
        @Size(max = 500) String name,
        @Size(max = 50) String unit,
        @PositiveOrZero BigDecimal quantity,
        @Size(max = 100) String justification,
        String notes,
        @Size(max = 500) String sectionName,
        String coefficients,
        BigDecimal basePrice2001,
        BigDecimal priceIndex,
        BigDecimal currentPrice,
        BigDecimal baseLaborCost,
        BigDecimal baseMaterialCost,
        BigDecimal baseEquipmentCost,
        BigDecimal baseOverheadCost,
        BigDecimal baseTotal,
        BigDecimal currentLaborCost,
        BigDecimal currentMaterialCost,
        BigDecimal currentEquipmentCost,
        BigDecimal currentOverheadCost,
        BigDecimal currentTotal,
        BigDecimal totalAmount,
        BigDecimal laborIndex,
        BigDecimal materialIndex,
        BigDecimal equipmentIndex,
        BigDecimal overheadRate,
        String overheadBase,
        BigDecimal profitRate,
        String profitBase,
        BigDecimal directCosts,
        BigDecimal overheadCosts,
        BigDecimal estimatedProfit,
        @Size(max = 50) String normativeCode,
        BigDecimal normHours,
        BigDecimal machineryHours,
        UUID budgetItemId,
        UUID specItemId
) {}
