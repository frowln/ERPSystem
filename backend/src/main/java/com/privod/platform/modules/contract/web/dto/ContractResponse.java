package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ContractResponse(
        UUID id,
        String name,
        String number,
        LocalDate contractDate,
        UUID partnerId,
        String partnerName,
        UUID projectId,
        UUID typeId,
        ContractStatus status,
        String statusDisplayName,
        BigDecimal amount,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalWithVat,
        String paymentTerms,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        UUID responsibleId,
        BigDecimal retentionPercent,
        Integer docVersion,
        String versionComment,
        UUID parentVersionId,
        String rejectionReason,
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal balance,
        boolean expired,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractResponse fromEntity(Contract contract) {
        return new ContractResponse(
                contract.getId(),
                contract.getName(),
                contract.getNumber(),
                contract.getContractDate(),
                contract.getPartnerId(),
                contract.getPartnerName(),
                contract.getProjectId(),
                contract.getTypeId(),
                contract.getStatus(),
                contract.getStatus().getDisplayName(),
                contract.getAmount(),
                contract.getVatRate(),
                contract.getVatAmount(),
                contract.getTotalWithVat(),
                contract.getPaymentTerms(),
                contract.getPlannedStartDate(),
                contract.getPlannedEndDate(),
                contract.getActualStartDate(),
                contract.getActualEndDate(),
                contract.getResponsibleId(),
                contract.getRetentionPercent(),
                contract.getDocVersion(),
                contract.getVersionComment(),
                contract.getParentVersionId(),
                contract.getRejectionReason(),
                contract.getTotalInvoiced(),
                contract.getTotalPaid(),
                contract.getBalance(),
                contract.isExpired(),
                contract.getNotes(),
                contract.getCreatedAt(),
                contract.getUpdatedAt(),
                contract.getCreatedBy()
        );
    }
}
