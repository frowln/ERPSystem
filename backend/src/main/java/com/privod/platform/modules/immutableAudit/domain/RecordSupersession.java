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
@Table(name = "record_supersessions", indexes = {
        @Index(name = "idx_supersession_original", columnList = "original_record_id"),
        @Index(name = "idx_supersession_superseding", columnList = "superseding_record_id"),
        @Index(name = "idx_supersession_by", columnList = "superseded_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordSupersession extends BaseEntity {

    @Column(name = "original_record_id", nullable = false)
    private UUID originalRecordId;

    @Column(name = "superseding_record_id", nullable = false)
    private UUID supersedingRecordId;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "superseded_at", nullable = false)
    private Instant supersededAt;

    @Column(name = "superseded_by_id", nullable = false)
    private UUID supersededById;
}
