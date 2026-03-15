package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.FinancingScheduleEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancingScheduleEntryResponse(
        UUID id,
        UUID contractId,
        LocalDate periodDate,
        BigDecimal plannedAmount,
        BigDecimal actualAmount,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static FinancingScheduleEntryResponse fromEntity(FinancingScheduleEntry e) {
        return new FinancingScheduleEntryResponse(
                e.getId(),
                e.getContractId(),
                e.getPeriodDate(),
                e.getPlannedAmount(),
                e.getActualAmount(),
                e.getDescription(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
