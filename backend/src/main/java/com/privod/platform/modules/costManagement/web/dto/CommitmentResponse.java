package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.Commitment;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.domain.CommitmentType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CommitmentResponse(
        UUID id,
        UUID projectId,
        String number,
        String title,
        CommitmentType commitmentType,
        String commitmentTypeDisplayName,
        CommitmentStatus status,
        String statusDisplayName,
        UUID vendorId,
        UUID contractId,
        BigDecimal originalAmount,
        BigDecimal revisedAmount,
        BigDecimal approvedChangeOrders,
        BigDecimal invoicedAmount,
        BigDecimal paidAmount,
        BigDecimal retentionPercent,
        BigDecimal remainingAmount,
        LocalDate startDate,
        LocalDate endDate,
        UUID costCodeId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CommitmentResponse fromEntity(Commitment entity) {
        return new CommitmentResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getCommitmentType(),
                entity.getCommitmentType().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getVendorId(),
                entity.getContractId(),
                entity.getOriginalAmount(),
                entity.getRevisedAmount(),
                entity.getApprovedChangeOrders(),
                entity.getInvoicedAmount(),
                entity.getPaidAmount(),
                entity.getRetentionPercent(),
                entity.getRemainingAmount(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getCostCodeId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
