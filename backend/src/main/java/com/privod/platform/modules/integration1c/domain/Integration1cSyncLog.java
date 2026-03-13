package com.privod.platform.modules.integration1c.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "integration_1c_sync_logs", indexes = {
        @Index(name = "idx_i1c_sync_config", columnList = "config_id"),
        @Index(name = "idx_i1c_sync_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Integration1cSyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "config_id", nullable = false)
    private UUID configId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 20)
    private SyncDirection direction;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SyncStatus status = SyncStatus.PENDING;

    @Column(name = "records_processed")
    @Builder.Default
    private int recordsProcessed = 0;

    @Column(name = "records_errored")
    @Builder.Default
    private int recordsErrored = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
