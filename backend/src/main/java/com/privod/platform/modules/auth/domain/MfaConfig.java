package com.privod.platform.modules.auth.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "mfa_configs", indexes = {
        @Index(name = "idx_mfa_config_user", columnList = "user_id"),
        @Index(name = "idx_mfa_config_method", columnList = "method")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_mfa_config_user_method",
                columnNames = {"user_id", "method"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaConfig extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private MfaMethod method;

    @Column(name = "secret", length = 500)
    private String secret;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = false;

    @Column(name = "enabled_at")
    private Instant enabledAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "backup_codes", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> backupCodes = List.of();

    public void enable() {
        this.isEnabled = true;
        this.enabledAt = Instant.now();
    }

    public void disable() {
        this.isEnabled = false;
        this.secret = null;
        this.backupCodes = List.of();
    }
}
