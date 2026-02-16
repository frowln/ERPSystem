package com.privod.platform.modules.monitoring.service;

import com.privod.platform.modules.monitoring.domain.BackupRecord;
import com.privod.platform.modules.monitoring.domain.BackupStatus;
import com.privod.platform.modules.monitoring.repository.BackupRecordRepository;
import com.privod.platform.modules.monitoring.web.dto.BackupRecordResponse;
import com.privod.platform.modules.monitoring.web.dto.StartBackupRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final BackupRecordRepository backupRecordRepository;

    @Transactional
    public BackupRecordResponse startBackup(StartBackupRequest request) {
        // Check if another backup is already in progress
        backupRecordRepository.findByStatusAndDeletedFalse(BackupStatus.IN_PROGRESS)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Резервное копирование уже выполняется: " + existing.getId());
                });

        BackupRecord record = BackupRecord.builder()
                .backupType(request.backupType())
                .status(BackupStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .storageLocation(request.storageLocation())
                .build();

        record = backupRecordRepository.save(record);
        log.info("Backup started: {} ({})", request.backupType(), record.getId());

        // In production: trigger async backup process
        // For now, mark as completed immediately (simulated)
        record.setStatus(BackupStatus.COMPLETED);
        record.setCompletedAt(Instant.now());
        record.setSizeBytes(0L);
        record = backupRecordRepository.save(record);

        return BackupRecordResponse.fromEntity(record);
    }

    @Transactional(readOnly = true)
    public BackupRecordResponse getStatus(UUID backupId) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .filter(br -> !br.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запись резервного копирования не найдена: " + backupId));
        return BackupRecordResponse.fromEntity(record);
    }

    @Transactional(readOnly = true)
    public Page<BackupRecordResponse> getHistory(Pageable pageable) {
        return backupRecordRepository.findByDeletedFalseOrderByCreatedAtDesc(pageable)
                .map(BackupRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BackupRecordResponse getLatest() {
        BackupRecord record = backupRecordRepository.findLatest()
                .orElseThrow(() -> new EntityNotFoundException(
                        "Записи резервного копирования не найдены"));
        return BackupRecordResponse.fromEntity(record);
    }
}
