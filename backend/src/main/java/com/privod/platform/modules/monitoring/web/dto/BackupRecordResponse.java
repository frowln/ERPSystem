package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.BackupRecord;
import com.privod.platform.modules.monitoring.domain.BackupStatus;
import com.privod.platform.modules.monitoring.domain.BackupType;

import java.time.Instant;
import java.util.UUID;

public record BackupRecordResponse(
        UUID id,
        BackupType backupType,
        String backupTypeDisplayName,
        BackupStatus status,
        String statusDisplayName,
        Instant startedAt,
        Instant completedAt,
        Long sizeBytes,
        String storageLocation,
        String errorMessage,
        Instant createdAt
) {
    public static BackupRecordResponse fromEntity(BackupRecord br) {
        return new BackupRecordResponse(
                br.getId(),
                br.getBackupType(),
                br.getBackupType().getDisplayName(),
                br.getStatus(),
                br.getStatus().getDisplayName(),
                br.getStartedAt(),
                br.getCompletedAt(),
                br.getSizeBytes(),
                br.getStorageLocation(),
                br.getErrorMessage(),
                br.getCreatedAt()
        );
    }
}
