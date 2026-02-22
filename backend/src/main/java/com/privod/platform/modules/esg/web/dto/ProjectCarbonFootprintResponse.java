package com.privod.platform.modules.esg.web.dto;

import com.privod.platform.modules.esg.domain.ProjectCarbonFootprint;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectCarbonFootprintResponse(
        UUID id,
        UUID projectId,
        BigDecimal totalEmbodiedCarbon,
        String materialBreakdownJson,
        BigDecimal totalEnergyKwh,
        String energySourceBreakdownJson,
        BigDecimal totalWasteTons,
        BigDecimal wasteDivertedTons,
        BigDecimal wasteDiversionRate,
        String wasteBreakdownJson,
        BigDecimal totalWaterM3,
        BigDecimal totalCarbonFootprint,
        BigDecimal carbonPerSqm,
        BigDecimal builtAreaSqm,
        Instant calculatedAt,
        LocalDate periodFrom,
        LocalDate periodTo,
        Instant createdAt
) {
    public static ProjectCarbonFootprintResponse fromEntity(ProjectCarbonFootprint entity) {
        return new ProjectCarbonFootprintResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getTotalEmbodiedCarbon(),
                entity.getMaterialBreakdownJson(),
                entity.getTotalEnergyKwh(),
                entity.getEnergySourceBreakdownJson(),
                entity.getTotalWasteTons(),
                entity.getWasteDivertedTons(),
                entity.getWasteDiversionRate(),
                entity.getWasteBreakdownJson(),
                entity.getTotalWaterM3(),
                entity.getTotalCarbonFootprint(),
                entity.getCarbonPerSqm(),
                entity.getBuiltAreaSqm(),
                entity.getCalculatedAt(),
                entity.getPeriodFrom(),
                entity.getPeriodTo(),
                entity.getCreatedAt()
        );
    }
}
