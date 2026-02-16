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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "login_attempts", indexes = {
        @Index(name = "idx_login_attempt_user", columnList = "user_id"),
        @Index(name = "idx_login_attempt_email", columnList = "email"),
        @Index(name = "idx_login_attempt_ip", columnList = "ip_address"),
        @Index(name = "idx_login_attempt_at", columnList = "attempted_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt extends BaseEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    @Column(name = "is_successful", nullable = false)
    @Builder.Default
    private boolean isSuccessful = false;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private Instant attemptedAt = Instant.now();
}
