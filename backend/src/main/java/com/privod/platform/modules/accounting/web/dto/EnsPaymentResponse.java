package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsPayment;
import com.privod.platform.modules.accounting.domain.EnsPaymentStatus;
import com.privod.platform.modules.accounting.domain.EnsTaxType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EnsPaymentResponse(
        UUID id,
        UUID ensAccountId,
        BigDecimal amount,
        LocalDate paymentDate,
        EnsTaxType taxType,
        String taxTypeDisplayName,
        EnsPaymentStatus status,
        String statusDisplayName,
        String receiptUrl,
        Instant createdAt,
        String createdBy
) {
    public static EnsPaymentResponse fromEntity(EnsPayment entity) {
        return new EnsPaymentResponse(
                entity.getId(),
                entity.getEnsAccountId(),
                entity.getAmount(),
                entity.getPaymentDate(),
                entity.getTaxType(),
                entity.getTaxType().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getReceiptUrl(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
