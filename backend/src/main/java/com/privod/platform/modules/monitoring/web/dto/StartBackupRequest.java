package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.BackupType;
import jakarta.validation.constraints.NotNull;

public record StartBackupRequest(
        @NotNull(message = "Тип резервного копирования обязателен")
        BackupType backupType,

        String storageLocation
) {
}
