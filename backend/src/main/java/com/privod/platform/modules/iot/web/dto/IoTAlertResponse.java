package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.AlertSeverity;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.AlertType;
import com.privod.platform.modules.iot.domain.IoTAlert;

import java.time.Instant;
import java.util.UUID;

public record IoTAlertResponse(
        UUID id,
        UUID deviceId,
        AlertType alertType,
        String alertTypeDisplayName,
        AlertSeverity severity,
        String severityDisplayName,
        String message,
        Double thresholdValue,
        Double actualValue,
        AlertStatus status,
        String statusDisplayName,
        UUID acknowledgedById,
        Instant resolvedAt,
        Instant createdAt
) {
    public static IoTAlertResponse fromEntity(IoTAlert entity) {
        return new IoTAlertResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getAlertType(),
                entity.getAlertType().getDisplayName(),
                entity.getSeverity(),
                entity.getSeverity().getDisplayName(),
                entity.getMessage(),
                entity.getThresholdValue(),
                entity.getActualValue(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getAcknowledgedById(),
                entity.getResolvedAt(),
                entity.getCreatedAt()
        );
    }
}
