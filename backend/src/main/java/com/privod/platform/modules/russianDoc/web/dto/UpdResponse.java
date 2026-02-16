package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.Upd;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UpdResponse(
        UUID id,
        String number,
        LocalDate date,
        UUID sellerId,
        UUID buyerId,
        String items,
        BigDecimal totalAmount,
        BigDecimal vatAmount,
        RussianDocStatus status,
        String statusDisplayName,
        Instant signedAt,
        UUID signedById,
        UUID organizationId,
        UUID projectId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static UpdResponse fromEntity(Upd entity) {
        return new UpdResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getDate(),
                entity.getSellerId(),
                entity.getBuyerId(),
                entity.getItems(),
                entity.getTotalAmount(),
                entity.getVatAmount(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getSignedAt(),
                entity.getSignedById(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
