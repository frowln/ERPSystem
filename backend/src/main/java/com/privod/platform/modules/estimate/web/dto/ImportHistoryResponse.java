package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.ImportHistory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ImportHistoryResponse(
        UUID id,
        String fileName,
        String format,
        Instant importDate,
        String status,
        int itemsImported,
        List<String> errors
) {
    public static ImportHistoryResponse fromEntity(ImportHistory entity) {
        List<String> errorList = null;
        if (entity.getErrors() != null && !entity.getErrors().isBlank()) {
            errorList = List.of(entity.getErrors().split("\\|"));
        }
        return new ImportHistoryResponse(
                entity.getId(),
                entity.getFileName(),
                entity.getFormat(),
                entity.getImportDate(),
                entity.getStatus(),
                entity.getItemsImported(),
                errorList
        );
    }
}
