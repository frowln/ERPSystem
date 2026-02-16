package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        String number,
        LocalDate paymentDate,
        UUID projectId,
        String projectName,
        UUID contractId,
        UUID partnerId,
        String partnerName,
        PaymentType paymentType,
        String paymentTypeDisplayName,
        PaymentStatus status,
        String statusDisplayName,
        BigDecimal amount,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        String purpose,
        String bankAccount,
        UUID invoiceId,
        UUID approvedById,
        Instant approvedAt,
        Instant paidAt,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PaymentResponse fromEntity(Payment payment) {
        return fromEntity(payment, null);
    }

    public static PaymentResponse fromEntity(Payment payment, String projectName) {
        return new PaymentResponse(
                payment.getId(),
                payment.getNumber(),
                payment.getPaymentDate(),
                payment.getProjectId(),
                projectName,
                payment.getContractId(),
                payment.getPartnerId(),
                payment.getPartnerName(),
                payment.getPaymentType(),
                payment.getPaymentType().getDisplayName(),
                payment.getStatus(),
                payment.getStatus().getDisplayName(),
                payment.getAmount(),
                payment.getVatAmount(),
                payment.getTotalAmount(),
                payment.getPurpose(),
                payment.getBankAccount(),
                payment.getInvoiceId(),
                payment.getApprovedById(),
                payment.getApprovedAt(),
                payment.getPaidAt(),
                payment.getNotes(),
                payment.getCreatedAt(),
                payment.getUpdatedAt(),
                payment.getCreatedBy()
        );
    }
}
