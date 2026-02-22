package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.AsBuiltWbsLink;

import java.time.Instant;
import java.util.UUID;

public record AsBuiltWbsLinkResponse(
        UUID id,
        UUID wbsNodeId,
        String docCategory,
        UUID documentContainerId,
        String status,
        String statusDisplayName,
        Instant createdAt
) {
    public static AsBuiltWbsLinkResponse fromEntity(AsBuiltWbsLink e) {
        return new AsBuiltWbsLinkResponse(
                e.getId(),
                e.getWbsNodeId(),
                e.getDocCategory(),
                e.getDocumentContainerId(),
                e.getStatus().name(),
                e.getStatus().getDisplayName(),
                e.getCreatedAt()
        );
    }
}
