package com.privod.platform.modules.settings.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audit_settings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_audit_setting_model", columnNames = {"model_name"})
        },
        indexes = {
                @Index(name = "idx_audit_setting_model", columnList = "model_name")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditSetting extends BaseEntity {

    @Column(name = "model_name", nullable = false, unique = true, length = 255)
    private String modelName;

    @Column(name = "track_create", nullable = false)
    @Builder.Default
    private boolean trackCreate = true;

    @Column(name = "track_update", nullable = false)
    @Builder.Default
    private boolean trackUpdate = true;

    @Column(name = "track_delete", nullable = false)
    @Builder.Default
    private boolean trackDelete = true;

    @Column(name = "track_read", nullable = false)
    @Builder.Default
    private boolean trackRead = false;

    @Column(name = "retention_days", nullable = false)
    @Builder.Default
    private Integer retentionDays = 365;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
