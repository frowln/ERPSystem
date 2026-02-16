package com.privod.platform.modules.m29.web.dto;

import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record M29Response(
        UUID id,
        String name,
        LocalDate documentDate,
        UUID projectId,
        UUID contractId,
        UUID warehouseLocationId,
        UUID ks2Id,
        M29Status status,
        String statusDisplayName,
        String notes,
        List<M29LineResponse> lines,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static M29Response fromEntity(M29Document doc, List<M29LineResponse> lines) {
        return new M29Response(
                doc.getId(),
                doc.getName(),
                doc.getDocumentDate(),
                doc.getProjectId(),
                doc.getContractId(),
                doc.getWarehouseLocationId(),
                doc.getKs2Id(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getNotes(),
                lines,
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                doc.getCreatedBy()
        );
    }
}
