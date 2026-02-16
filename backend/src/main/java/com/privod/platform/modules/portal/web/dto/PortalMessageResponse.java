package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalMessage;

import java.time.Instant;
import java.util.UUID;

public record PortalMessageResponse(
        UUID id,
        UUID fromPortalUserId,
        UUID toPortalUserId,
        UUID fromInternalUserId,
        UUID toInternalUserId,
        UUID projectId,
        String subject,
        String content,
        boolean isRead,
        Instant readAt,
        UUID parentMessageId,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalMessageResponse fromEntity(PortalMessage msg) {
        return new PortalMessageResponse(
                msg.getId(),
                msg.getFromPortalUserId(),
                msg.getToPortalUserId(),
                msg.getFromInternalUserId(),
                msg.getToInternalUserId(),
                msg.getProjectId(),
                msg.getSubject(),
                msg.getContent(),
                msg.isRead(),
                msg.getReadAt(),
                msg.getParentMessageId(),
                msg.getCreatedAt(),
                msg.getUpdatedAt()
        );
    }
}
