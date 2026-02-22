package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.LocalEstimateLine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LocalEstimateLineResponse(
        UUID id,
        UUID estimateId,
        int lineNumber,
        UUID rateId,
        String justification,
        String name,
        String unit,
        BigDecimal quantity,
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
        BigDecimal laborIndex,
        BigDecimal materialIndex,
        BigDecimal equipmentIndex,
        String notes,
        String normativeCode,
        BigDecimal normHours,
        BigDecimal basePrice2001,
        BigDecimal priceIndex,
        BigDecimal currentPrice,
        BigDecimal directCosts,
        BigDecimal overheadCosts,
        BigDecimal estimatedProfit,
        UUID budgetItemId,
        Instant createdAt,
        Instant updatedAt
) {
    public static LocalEstimateLineResponse fromEntity(LocalEstimateLine entity) {
        return new LocalEstimateLineResponse(
                entity.getId(),
                entity.getEstimateId(),
                entity.getLineNumber(),
                entity.getRateId(),
                entity.getJustification(),
                entity.getName(),
                entity.getUnit(),
                entity.getQuantity(),
                entity.getBaseLaborCost(),
                entity.getBaseMaterialCost(),
                entity.getBaseEquipmentCost(),
                entity.getBaseOverheadCost(),
                entity.getBaseTotal(),
                entity.getCurrentLaborCost(),
                entity.getCurrentMaterialCost(),
                entity.getCurrentEquipmentCost(),
                entity.getCurrentOverheadCost(),
                entity.getCurrentTotal(),
                entity.getLaborIndex(),
                entity.getMaterialIndex(),
                entity.getEquipmentIndex(),
                entity.getNotes(),
                entity.getNormativeCode(),
                entity.getNormHours(),
                entity.getBasePrice2001(),
                entity.getPriceIndex(),
                entity.getCurrentPrice(),
                entity.getDirectCosts(),
                entity.getOverheadCosts(),
                entity.getEstimatedProfit(),
                entity.getBudgetItemId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
