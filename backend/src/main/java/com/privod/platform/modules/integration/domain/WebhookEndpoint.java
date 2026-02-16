package com.privod.platform.modules.integration.domain;

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

@Entity
@Table(name = "webhook_endpoints", indexes = {
        @Index(name = "idx_we_code", columnList = "code", unique = true),
        @Index(name = "idx_we_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEndpoint extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "secret", columnDefinition = "TEXT")
    private String secret;

    @Column(name = "events", columnDefinition = "JSONB", nullable = false)
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

    @Column(name = "last_failure_reason", columnDefinition = "TEXT")
    private String lastFailureReason;
}
