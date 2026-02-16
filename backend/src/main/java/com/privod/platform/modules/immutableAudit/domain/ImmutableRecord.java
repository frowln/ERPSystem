package com.privod.platform.modules.immutableAudit.domain;

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
@Table(name = "immutable_records", indexes = {
        @Index(name = "idx_immutable_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_immutable_hash", columnList = "record_hash"),
        @Index(name = "idx_immutable_prev", columnList = "previous_record_id"),
        @Index(name = "idx_immutable_recorded_at", columnList = "recorded_at"),
        @Index(name = "idx_immutable_recorded_by", columnList = "recorded_by_id"),
        @Index(name = "idx_immutable_superseded", columnList = "is_superseded")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImmutableRecord extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "record_hash", nullable = false, length = 64)
    private String recordHash;

    @Column(name = "content_snapshot", columnDefinition = "JSONB")
    private String contentSnapshot;

    @Column(name = "previous_record_id")
    private UUID previousRecordId;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "recorded_by_id")
    private UUID recordedById;

    @Column(name = "action", length = 30)
    private String action;

    @Column(name = "record_version")
    private Integer recordVersion;

    @Column(name = "is_superseded", nullable = false)
    @Builder.Default
    private Boolean isSuperseded = false;

    @Column(name = "superseded_by_id")
    private UUID supersededById;

    @Column(name = "superseded_at")
    private Instant supersededAt;

    @Column(name = "chain_valid")
    private Boolean chainValid;
}
