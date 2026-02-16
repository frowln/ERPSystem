package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Ks2Response(
        UUID id,
        String number,
        LocalDate documentDate,
        String name,
        UUID projectId,
        UUID contractId,
        ClosingDocumentStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        BigDecimal totalQuantity,
        String notes,
        UUID signedById,
        Instant signedAt,
        List<Ks2LineResponse> lines,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static Ks2Response fromEntity(Ks2Document doc, List<Ks2LineResponse> lines) {
        return new Ks2Response(
                doc.getId(),
                doc.getNumber(),
                doc.getDocumentDate(),
                doc.getName(),
                doc.getProjectId(),
                doc.getContractId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getTotalAmount(),
                doc.getTotalQuantity(),
                doc.getNotes(),
                doc.getSignedById(),
                doc.getSignedAt(),
                lines,
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                doc.getCreatedBy()
        );
    }
}
