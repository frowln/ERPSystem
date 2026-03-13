package com.privod.platform.modules.edo.web.dto;

import com.privod.platform.modules.edo.domain.EdoDocument;
import com.privod.platform.modules.edo.domain.EdoDocumentStatus;

import java.time.Instant;
import java.util.UUID;

public record EdoSendResult(
        UUID edoDocumentId,
        String externalId,
        EdoDocumentStatus status,
        String statusDisplayName,
        String sourceType,
        UUID sourceId,
        Instant sentAt
) {
    public static EdoSendResult fromEntity(EdoDocument doc) {
        return new EdoSendResult(
                doc.getId(),
                doc.getExternalId(),
                doc.getStatus(),
                doc.getStatus().getDisplayName(),
                doc.getSourceType(),
                doc.getSourceId(),
                doc.getSentAt()
        );
    }
}
