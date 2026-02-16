package com.privod.platform.modules.closing.web.dto;

import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks3Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record Ks3ListResponse(
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
        BigDecimal netAmount
) {
    public static Ks3ListResponse fromEntity(Ks3Document doc) {
        return new Ks3ListResponse(
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
                doc.getNetAmount()
        );
    }
}
