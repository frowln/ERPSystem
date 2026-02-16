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
@Table(name = "onec_mappings", indexes = {
        @Index(name = "idx_onec_map_entity_type", columnList = "entity_type"),
        @Index(name = "idx_onec_map_privod_id", columnList = "privod_id"),
        @Index(name = "idx_onec_map_onec_id", columnList = "onec_id"),
        @Index(name = "idx_onec_map_sync_status", columnList = "sync_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneCMapping extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "privod_id", nullable = false)
    private UUID privodId;

    @Column(name = "onec_id", nullable = false, length = 255)
    private String oneCId;

    @Column(name = "onec_code", length = 100)
    private String oneCCode;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private OneCMappingSyncStatus syncStatus = OneCMappingSyncStatus.PENDING;

    @Column(name = "conflict_data", columnDefinition = "JSONB")
    private String conflictData;
}
