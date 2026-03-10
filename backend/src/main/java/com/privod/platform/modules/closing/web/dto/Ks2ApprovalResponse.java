package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Ks2ApprovalResponse(
        UUID id,
        UUID ks2Id,
        String ks2Number,
        String ks2Name,
        LocalDate documentDate,
        UUID projectId,
        UUID contractId,
        ClosingDocumentStatus status,
        String statusDisplayName,
        BigDecimal totalAmount,
        Instant createdAt,
        String createdBy
) {
    public static Ks2ApprovalResponse fromEntity(Ks2Document doc) {
        return new Ks2ApprovalResponse(
                doc.getId(),
                doc.getId(),
                doc.getNumber(),
                doc.getName(),
                doc.getDocumentDate(),
                doc.getProjectId(),
                doc.getContractId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getTotalAmount(),
                doc.getCreatedAt(),
                doc.getCreatedBy()
        );
    }
}
