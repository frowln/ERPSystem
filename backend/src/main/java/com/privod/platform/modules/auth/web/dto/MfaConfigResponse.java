package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.MfaConfig;
import com.privod.platform.modules.auth.domain.MfaMethod;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MfaConfigResponse(
        UUID id,
        UUID userId,
        MfaMethod method,
        String methodDisplayName,
        boolean isEnabled,
        Instant enabledAt,
        List<String> backupCodes,
        Instant createdAt
) {
    public static MfaConfigResponse fromEntity(MfaConfig entity) {
        return new MfaConfigResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getMethod(),
                entity.getMethod().getDisplayName(),
                entity.isEnabled(),
                entity.getEnabledAt(),
                entity.getBackupCodes(),
                entity.getCreatedAt()
        );
    }
}
