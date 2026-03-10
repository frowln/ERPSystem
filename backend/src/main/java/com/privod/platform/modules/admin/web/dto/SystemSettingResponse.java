package com.privod.platform.modules.admin.web.dto;

import com.privod.platform.modules.settings.domain.SystemSetting;

import java.time.Instant;
import java.util.UUID;

public record SystemSettingResponse(
    UUID id,
    String key,
    String value,
    String type,
    String category,
    String description,
    Instant updatedAt,
    String updatedBy
) {
    public static SystemSettingResponse fromEntity(SystemSetting s) {
        return new SystemSettingResponse(
            s.getId(), s.getSettingKey(), s.getSettingValue(),
            s.getSettingType() != null ? s.getSettingType().name() : "STRING",
            s.getCategory() != null ? s.getCategory().name() : null,
            s.getDescription(),
            s.getUpdatedAt(), s.getUpdatedBy()
        );
    }
}
