package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailBlacklist;

import java.time.Instant;
import java.util.UUID;

public record MailBlacklistResponse(
        UUID id,
        String email,
        String reason,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailBlacklistResponse fromEntity(MailBlacklist blacklist) {
        return new MailBlacklistResponse(
                blacklist.getId(),
                blacklist.getEmail(),
                blacklist.getReason(),
                blacklist.isActive(),
                blacklist.getCreatedAt(),
                blacklist.getUpdatedAt()
        );
    }
}
