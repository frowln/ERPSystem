package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.SlaViolation;
import com.privod.platform.modules.contractExt.domain.ViolationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SlaViolationResponse(
        UUID id,
        UUID slaId,
        LocalDate violationDate,
        BigDecimal actualValue,
        BigDecimal penaltyAmount,
        ViolationStatus status,
        String statusDisplayName,
        Instant notifiedAt,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static SlaViolationResponse fromEntity(SlaViolation entity) {
        return new SlaViolationResponse(
                entity.getId(),
                entity.getSlaId(),
                entity.getViolationDate(),
                entity.getActualValue(),
                entity.getPenaltyAmount(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getNotifiedAt(),
                entity.getResolvedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
