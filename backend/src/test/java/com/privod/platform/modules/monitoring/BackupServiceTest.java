package com.privod.platform.modules.monitoring;

import com.privod.platform.modules.monitoring.domain.BackupRecord;
import com.privod.platform.modules.monitoring.domain.BackupStatus;
import com.privod.platform.modules.monitoring.domain.BackupType;
import com.privod.platform.modules.monitoring.repository.BackupRecordRepository;
import com.privod.platform.modules.monitoring.service.BackupService;
import com.privod.platform.modules.monitoring.web.dto.BackupRecordResponse;
import com.privod.platform.modules.monitoring.web.dto.StartBackupRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BackupServiceTest {

    @Mock
    private BackupRecordRepository backupRecordRepository;

    @InjectMocks
    private BackupService backupService;

    @Nested
    @DisplayName("Start Backup")
    class StartBackupTests {

        @Test
        @DisplayName("Should start backup and return completed record")
        void startBackup_Success() {
            StartBackupRequest request = new StartBackupRequest(BackupType.FULL, "/backups/full");

            when(backupRecordRepository.findByStatusAndDeletedFalse(BackupStatus.IN_PROGRESS))
                    .thenReturn(Optional.empty());
            when(backupRecordRepository.save(any(BackupRecord.class))).thenAnswer(inv -> {
                BackupRecord br = inv.getArgument(0);
                if (br.getId() == null) {
                    br.setId(UUID.randomUUID());
                    br.setCreatedAt(Instant.now());
                }
                return br;
            });

            BackupRecordResponse response = backupService.startBackup(request);

            assertThat(response.backupType()).isEqualTo(BackupType.FULL);
            assertThat(response.status()).isEqualTo(BackupStatus.COMPLETED);
            assertThat(response.startedAt()).isNotNull();
            assertThat(response.completedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw when another backup is in progress")
        void startBackup_AlreadyInProgress() {
            StartBackupRequest request = new StartBackupRequest(BackupType.FULL, "/backups/full");

            BackupRecord inProgress = BackupRecord.builder()
                    .backupType(BackupType.INCREMENTAL)
                    .status(BackupStatus.IN_PROGRESS)
                    .build();
            inProgress.setId(UUID.randomUUID());

            when(backupRecordRepository.findByStatusAndDeletedFalse(BackupStatus.IN_PROGRESS))
                    .thenReturn(Optional.of(inProgress));

            assertThatThrownBy(() -> backupService.startBackup(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже выполняется");
        }
    }

    @Nested
    @DisplayName("Get Status")
    class GetStatusTests {

        @Test
        @DisplayName("Should return backup status by ID")
        void getStatus_Found() {
            UUID backupId = UUID.randomUUID();
            BackupRecord record = BackupRecord.builder()
                    .backupType(BackupType.DATABASE_ONLY)
                    .status(BackupStatus.COMPLETED)
                    .startedAt(Instant.now().minusSeconds(60))
                    .completedAt(Instant.now())
                    .sizeBytes(1024000L)
                    .storageLocation("/backups/db_only")
                    .build();
            record.setId(backupId);
            record.setCreatedAt(Instant.now());

            when(backupRecordRepository.findById(backupId)).thenReturn(Optional.of(record));

            BackupRecordResponse response = backupService.getStatus(backupId);

            assertThat(response.backupType()).isEqualTo(BackupType.DATABASE_ONLY);
            assertThat(response.status()).isEqualTo(BackupStatus.COMPLETED);
            assertThat(response.sizeBytes()).isEqualTo(1024000L);
        }

        @Test
        @DisplayName("Should throw when backup not found")
        void getStatus_NotFound() {
            UUID invalidId = UUID.randomUUID();
            when(backupRecordRepository.findById(invalidId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> backupService.getStatus(invalidId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("не найдена");
        }
    }
}
