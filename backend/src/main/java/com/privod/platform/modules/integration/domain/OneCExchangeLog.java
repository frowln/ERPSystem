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
import java.util.UUID;

@Entity
@Table(name = "onec_exchange_logs", indexes = {
        @Index(name = "idx_onec_el_config", columnList = "config_id"),
        @Index(name = "idx_onec_el_status", columnList = "status"),
        @Index(name = "idx_onec_el_type", columnList = "exchange_type"),
        @Index(name = "idx_onec_el_direction", columnList = "direction"),
        @Index(name = "idx_onec_el_started", columnList = "started_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneCExchangeLog extends BaseEntity {

    @Column(name = "config_id", nullable = false)
    private UUID configId;

    @Enumerated(EnumType.STRING)
    @Column(name = "exchange_type", nullable = false, length = 20)
    private OneCExchangeType exchangeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 20)
    private SyncDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OneCExchangeStatus status = OneCExchangeStatus.STARTED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "records_processed", nullable = false)
    @Builder.Default
    private int recordsProcessed = 0;

    @Column(name = "records_failed", nullable = false)
    @Builder.Default
    private int recordsFailed = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "details", columnDefinition = "JSONB")
    private String details;

    public boolean canTransitionTo(OneCExchangeStatus target) {
        return this.status.canTransitionTo(target);
    }
}
