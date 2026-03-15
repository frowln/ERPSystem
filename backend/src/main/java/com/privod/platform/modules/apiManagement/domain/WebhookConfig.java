package com.privod.platform.modules.apiManagement.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "webhook_configs", indexes = {
        @Index(name = "idx_webhook_config_active", columnList = "is_active"),
        @Index(name = "idx_webhook_config_url", columnList = "url")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookConfig extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "secret", length = 255)
    private String secret;

    @Column(name = "events", columnDefinition = "JSONB")
    @Builder.Default
    private String events = "[]";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_triggered_at")
    private Instant lastTriggeredAt;

    @Column(name = "failure_count", nullable = false)
    @Builder.Default
    private int failureCount = 0;

    @Column(name = "last_failure_at")
    private Instant lastFailureAt;

    @Column(name = "last_failure_message", length = 2000)
    private String lastFailureMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "retry_policy", nullable = false, length = 20)
    @Builder.Default
    private RetryPolicy retryPolicy = RetryPolicy.EXPONENTIAL;

    @Column(name = "secondary_secret", length = 255)
    private String secondarySecret;

    @Column(name = "secret_rotation_at")
    private Instant secretRotationAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resource_filter", columnDefinition = "JSONB")
    @Builder.Default
    private String resourceFilter = "{}";
}
