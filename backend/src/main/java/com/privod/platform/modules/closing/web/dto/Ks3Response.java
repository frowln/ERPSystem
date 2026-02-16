package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks3Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Ks3Response(
        UUID id,
        String number,
        LocalDate documentDate,
        String name,
        LocalDate periodFrom,
        LocalDate periodTo,
        UUID projectId,
        UUID contractId,
        ClosingDocumentStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal retentionPercent,
        BigDecimal retentionAmount,
        BigDecimal netAmount,
        String notes,
        UUID signedById,
        Instant signedAt,
        List<Ks2ListResponse> linkedKs2,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static Ks3Response fromEntity(Ks3Document doc, List<Ks2ListResponse> linkedKs2) {
        return new Ks3Response(
                doc.getId(),
                doc.getNumber(),
                doc.getDocumentDate(),
                doc.getName(),
                doc.getPeriodFrom(),
                doc.getPeriodTo(),
                doc.getProjectId(),
                doc.getContractId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getTotalAmount(),
                doc.getRetentionPercent(),
                doc.getRetentionAmount(),
                doc.getNetAmount(),
                doc.getNotes(),
                doc.getSignedById(),
                doc.getSignedAt(),
                linkedKs2,
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                doc.getCreatedBy()
        );
    }
}
