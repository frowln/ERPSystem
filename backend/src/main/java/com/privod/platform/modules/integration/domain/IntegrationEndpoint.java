package com.privod.platform.modules.integration.domain;

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

import java.time.Instant;

@Entity
@Table(name = "integration_endpoints", indexes = {
        @Index(name = "idx_ie_code", columnList = "code", unique = true),
        @Index(name = "idx_ie_provider", columnList = "provider"),
        @Index(name = "idx_ie_active", columnList = "is_active"),
        @Index(name = "idx_ie_health", columnList = "health_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationEndpoint extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 30)
    private IntegrationProvider provider;

    @Column(name = "base_url", nullable = false, length = 1000)
    private String baseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false, length = 20)
    private AuthType authType;

    @Column(name = "credentials", columnDefinition = "TEXT")
    private String credentials;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_health_check")
    private Instant lastHealthCheck;

    @Enumerated(EnumType.STRING)
    @Column(name = "health_status", nullable = false, length = 20)
    @Builder.Default
    private HealthStatus healthStatus = HealthStatus.DOWN;

    @Column(name = "rate_limit_per_minute", nullable = false)
    @Builder.Default
    private int rateLimitPerMinute = 60;

    @Column(name = "timeout_ms", nullable = false)
    @Builder.Default
    private int timeoutMs = 30000;
}
