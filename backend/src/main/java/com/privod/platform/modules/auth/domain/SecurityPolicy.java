package com.privod.platform.modules.auth.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "security_policies", indexes = {
        @Index(name = "idx_security_policy_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityPolicy extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "password_min_length", nullable = false)
    @Builder.Default
    private int passwordMinLength = 8;

    @Column(name = "password_requires_uppercase", nullable = false)
    @Builder.Default
    private boolean passwordRequiresUppercase = true;

    @Column(name = "password_requires_number", nullable = false)
    @Builder.Default
    private boolean passwordRequiresNumber = true;

    @Column(name = "password_requires_special", nullable = false)
    @Builder.Default
    private boolean passwordRequiresSpecial = false;

    @Column(name = "password_expiry_days", nullable = false)
    @Builder.Default
    private int passwordExpiryDays = 0;

    @Column(name = "max_login_attempts", nullable = false)
    @Builder.Default
    private int maxLoginAttempts = 5;

    @Column(name = "lockout_duration_minutes", nullable = false)
    @Builder.Default
    private int lockoutDurationMinutes = 30;

    @Column(name = "session_timeout_minutes", nullable = false)
    @Builder.Default
    private int sessionTimeoutMinutes = 480;

    @Column(name = "require_mfa", nullable = false)
    @Builder.Default
    private boolean requireMfa = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_ip_ranges", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> allowedIpRanges = List.of();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
