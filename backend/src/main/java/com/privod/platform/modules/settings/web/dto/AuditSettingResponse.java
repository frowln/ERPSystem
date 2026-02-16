package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.AuditSetting;

import java.time.Instant;
import java.util.UUID;

public record AuditSettingResponse(
        UUID id,
        String modelName,
        boolean trackCreate,
        boolean trackUpdate,
        boolean trackDelete,
        boolean trackRead,
        Integer retentionDays,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static AuditSettingResponse fromEntity(AuditSetting setting) {
        return new AuditSettingResponse(
                setting.getId(),
                setting.getModelName(),
                setting.isTrackCreate(),
                setting.isTrackUpdate(),
                setting.isTrackDelete(),
                setting.isTrackRead(),
                setting.getRetentionDays(),
                setting.isActive(),
                setting.getCreatedAt(),
                setting.getUpdatedAt()
        );
    }
}
