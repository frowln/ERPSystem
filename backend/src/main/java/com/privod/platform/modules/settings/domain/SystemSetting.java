package com.privod.platform.modules.settings.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "system_settings", indexes = {
        @Index(name = "idx_system_setting_key", columnList = "setting_key", unique = true),
        @Index(name = "idx_system_setting_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 255)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "setting_type", nullable = false, length = 30)
    @Builder.Default
    private SettingType settingType = SettingType.STRING;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    @Builder.Default
    private SettingCategory category = SettingCategory.GENERAL;

    @Column(name = "display_name", nullable = false, length = 500)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_editable", nullable = false)
    @Builder.Default
    private boolean isEditable = true;

    @Column(name = "is_encrypted", nullable = false)
    @Builder.Default
    private boolean isEncrypted = false;
}
