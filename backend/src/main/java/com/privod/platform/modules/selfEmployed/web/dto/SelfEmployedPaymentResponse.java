package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPayment;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SelfEmployedPaymentResponse(
        UUID id,
        UUID contractorId,
        UUID projectId,
        UUID contractId,
        BigDecimal amount,
        String description,
        LocalDate serviceDate,
        LocalDate paymentDate,
        String receiptNumber,
        String receiptUrl,
        SelfEmployedPaymentStatus status,
        String statusDisplayName,
        boolean fiscalReceiptChecked,
        String taxPeriod,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SelfEmployedPaymentResponse fromEntity(SelfEmployedPayment p) {
        return new SelfEmployedPaymentResponse(
                p.getId(),
                p.getContractorId(),
                p.getProjectId(),
                p.getContractId(),
                p.getAmount(),
                p.getDescription(),
                p.getServiceDate(),
                p.getPaymentDate(),
                p.getReceiptNumber(),
                p.getReceiptUrl(),
                p.getStatus(),
                p.getStatus().getDisplayName(),
                p.isFiscalReceiptChecked(),
                p.getTaxPeriod(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getCreatedBy()
        );
    }
}
