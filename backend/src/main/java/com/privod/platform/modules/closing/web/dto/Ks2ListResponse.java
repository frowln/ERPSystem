package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record Ks2ListResponse(
        UUID id,
        String number,
        LocalDate documentDate,
        String name,
        UUID projectId,
        UUID contractId,
        ClosingDocumentStatus status,
        String statusDisplayName,
        BigDecimal totalAmount
) {
    public static Ks2ListResponse fromEntity(Ks2Document doc) {
        return new Ks2ListResponse(
                doc.getId(),
                doc.getNumber(),
                doc.getDocumentDate(),
                doc.getName(),
                doc.getProjectId(),
                doc.getContractId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getTotalAmount()
        );
    }
}
