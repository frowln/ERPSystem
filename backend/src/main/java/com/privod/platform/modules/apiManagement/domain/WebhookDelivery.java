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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_deliveries", indexes = {
        @Index(name = "idx_webhook_delivery_config", columnList = "webhook_config_id"),
        @Index(name = "idx_webhook_delivery_status", columnList = "status"),
        @Index(name = "idx_webhook_delivery_event", columnList = "event"),
        @Index(name = "idx_webhook_delivery_sent_at", columnList = "sent_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDelivery extends BaseEntity {

    @Column(name = "webhook_config_id", nullable = false)
    private UUID webhookConfigId;

    @Column(name = "event", nullable = false, length = 100)
    private String event;

    @Column(name = "payload", columnDefinition = "JSONB")
    @Builder.Default
    private String payload = "{}";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private WebhookDeliveryStatus status = WebhookDeliveryStatus.PENDING;

    @Column(name = "response_code")
    private Integer responseCode;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "next_retry_at")
    private Instant nextRetryAt;
}
