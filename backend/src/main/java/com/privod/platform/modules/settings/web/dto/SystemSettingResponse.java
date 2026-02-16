package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.domain.SettingType;
import com.privod.platform.modules.settings.domain.SystemSetting;

import java.time.Instant;
import java.util.UUID;

public record SystemSettingResponse(
        UUID id,
        String settingKey,
        String settingValue,
        SettingType settingType,
        String settingTypeDisplayName,
        SettingCategory category,
        String categoryDisplayName,
        String displayName,
        String description,
        boolean isEditable,
        boolean isEncrypted,
        Instant createdAt,
        Instant updatedAt
) {
    public static SystemSettingResponse fromEntity(SystemSetting setting) {
        String value = setting.getSettingValue();
        // Mask encrypted / secret values
        if (setting.isEncrypted() || setting.getSettingType() == SettingType.SECRET) {
            value = (value != null && !value.isEmpty()) ? "********" : "";
        }
        return new SystemSettingResponse(
                setting.getId(),
                setting.getSettingKey(),
                value,
                setting.getSettingType(),
                setting.getSettingType().getDisplayName(),
                setting.getCategory(),
                setting.getCategory().getDisplayName(),
                setting.getDisplayName(),
                setting.getDescription(),
                setting.isEditable(),
                setting.isEncrypted(),
                setting.getCreatedAt(),
                setting.getUpdatedAt()
        );
    }
}
