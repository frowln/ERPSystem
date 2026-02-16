package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BonusCalculation;
import com.privod.platform.modules.analytics.domain.BonusStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record BonusCalculationResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String period,
        BigDecimal baseBonus,
        BigDecimal kpiMultiplier,
        BigDecimal finalBonus,
        BonusStatus status,
        String statusDisplayName,
        UUID approvedById,
        LocalDateTime approvedAt,
        LocalDateTime paidAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static BonusCalculationResponse fromEntity(BonusCalculation bc) {
        return new BonusCalculationResponse(
                bc.getId(),
                bc.getEmployeeId(),
                bc.getEmployeeName(),
                bc.getPeriod(),
                bc.getBaseBonus(),
                bc.getKpiMultiplier(),
                bc.getFinalBonus(),
                bc.getStatus(),
                bc.getStatus().getDisplayName(),
                bc.getApprovedById(),
                bc.getApprovedAt(),
                bc.getPaidAt(),
                bc.getCreatedAt(),
                bc.getUpdatedAt()
        );
    }
}
