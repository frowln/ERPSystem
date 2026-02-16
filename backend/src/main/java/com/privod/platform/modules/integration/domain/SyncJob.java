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
@Table(name = "sync_jobs", indexes = {
        @Index(name = "idx_sj_code", columnList = "code", unique = true),
        @Index(name = "idx_sj_endpoint", columnList = "endpoint_id"),
        @Index(name = "idx_sj_status", columnList = "status"),
        @Index(name = "idx_sj_entity_type", columnList = "entity_type"),
        @Index(name = "idx_sj_started", columnList = "started_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncJob extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "endpoint_id", nullable = false)
    private UUID endpointId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_type", nullable = false, length = 20)
    private SyncType syncType;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 20)
    private SyncDirection direction;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SyncJobStatus status = SyncJobStatus.PENDING;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "processed_count", nullable = false)
    @Builder.Default
    private int processedCount = 0;

    @Column(name = "error_count", nullable = false)
    @Builder.Default
    private int errorCount = 0;

    @Column(name = "error_log", columnDefinition = "JSONB")
    private String errorLog;

    @Column(name = "last_sync_cursor", length = 500)
    private String lastSyncCursor;

    public boolean canTransitionTo(SyncJobStatus target) {
        return this.status.canTransitionTo(target);
    }
}
