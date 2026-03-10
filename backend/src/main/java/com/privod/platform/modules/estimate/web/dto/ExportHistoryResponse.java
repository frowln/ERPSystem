package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.ExportHistory;

import java.time.Instant;
import java.util.UUID;

public record ExportHistoryResponse(
        UUID id,
        UUID estimateId,
        String estimateName,
        Instant exportDate,
        String format,
        String status
) {
    public static ExportHistoryResponse fromEntity(ExportHistory entity) {
        return new ExportHistoryResponse(
                entity.getId(),
                entity.getEstimateId(),
                entity.getEstimateName(),
                entity.getExportDate(),
                entity.getFormat(),
                entity.getStatus()
        );
    }
}
