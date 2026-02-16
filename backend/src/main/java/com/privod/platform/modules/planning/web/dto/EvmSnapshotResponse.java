package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.EvmSnapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EvmSnapshotResponse(
        UUID id,
        UUID projectId,
        LocalDate snapshotDate,
        LocalDate dataDate,
        BigDecimal budgetAtCompletion,
        BigDecimal plannedValue,
        BigDecimal earnedValue,
        BigDecimal actualCost,
        BigDecimal cpi,
        BigDecimal spi,
        BigDecimal eac,
        BigDecimal etcValue,
        BigDecimal tcpi,
        BigDecimal percentComplete,
        Integer criticalPathLength,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static EvmSnapshotResponse fromEntity(EvmSnapshot snapshot) {
        return new EvmSnapshotResponse(
                snapshot.getId(),
                snapshot.getProjectId(),
                snapshot.getSnapshotDate(),
                snapshot.getDataDate(),
                snapshot.getBudgetAtCompletion(),
                snapshot.getPlannedValue(),
                snapshot.getEarnedValue(),
                snapshot.getActualCost(),
                snapshot.getCpi(),
                snapshot.getSpi(),
                snapshot.getEac(),
                snapshot.getEtcValue(),
                snapshot.getTcpi(),
                snapshot.getPercentComplete(),
                snapshot.getCriticalPathLength(),
                snapshot.getNotes(),
                snapshot.getCreatedAt(),
                snapshot.getUpdatedAt()
        );
    }
}
