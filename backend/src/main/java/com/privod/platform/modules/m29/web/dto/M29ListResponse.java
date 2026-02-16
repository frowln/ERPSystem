package com.privod.platform.modules.m29.web.dto;

import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Status;

import java.time.LocalDate;
import java.util.UUID;

public record M29ListResponse(
        UUID id,
        String name,
        LocalDate documentDate,
        UUID projectId,
        M29Status status,
        String statusDisplayName
) {
    public static M29ListResponse fromEntity(M29Document doc) {
        return new M29ListResponse(
                doc.getId(),
                doc.getName(),
                doc.getDocumentDate(),
                doc.getProjectId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName()
        );
    }
}
