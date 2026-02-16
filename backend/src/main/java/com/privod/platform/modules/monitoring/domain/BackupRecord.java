package com.privod.platform.modules.monitoring.domain;

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
@Table(name = "backup_records", indexes = {
        @Index(name = "idx_backup_type", columnList = "backup_type"),
        @Index(name = "idx_backup_status", columnList = "status"),
        @Index(name = "idx_backup_started_at", columnList = "started_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupRecord extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "backup_type", nullable = false, length = 20)
    private BackupType backupType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BackupStatus status = BackupStatus.PENDING;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "storage_location", length = 1000)
    private String storageLocation;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
