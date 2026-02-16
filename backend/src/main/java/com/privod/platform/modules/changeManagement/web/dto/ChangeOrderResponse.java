package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrder;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ChangeOrderResponse(
        UUID id,
        UUID projectId,
        UUID contractId,
        String number,
        String title,
        String description,
        ChangeOrderType changeOrderType,
        String changeOrderTypeDisplayName,
        ChangeOrderStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        Integer scheduleImpactDays,
        BigDecimal originalContractAmount,
        BigDecimal revisedContractAmount,
        UUID approvedById,
        LocalDate approvedDate,
        LocalDate executedDate,
        UUID changeOrderRequestId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ChangeOrderResponse fromEntity(ChangeOrder entity) {
        return new ChangeOrderResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getContractId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getChangeOrderType(),
                entity.getChangeOrderType() != null ? entity.getChangeOrderType().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getTotalAmount(),
                entity.getScheduleImpactDays(),
                entity.getOriginalContractAmount(),
                entity.getRevisedContractAmount(),
                entity.getApprovedById(),
                entity.getApprovedDate(),
                entity.getExecutedDate(),
                entity.getChangeOrderRequestId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
