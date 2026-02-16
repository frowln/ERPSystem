package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEvent;
import com.privod.platform.modules.monitoring.domain.SystemEventType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SystemEventResponse(
        UUID id,
        SystemEventType eventType,
        String eventTypeDisplayName,
        EventSeverity severity,
        String severityDisplayName,
        String message,
        Map<String, Object> details,
        String source,
        UUID userId,
        Instant occurredAt,
        Instant createdAt
) {
    public static SystemEventResponse fromEntity(SystemEvent event) {
        return new SystemEventResponse(
                event.getId(),
                event.getEventType(),
                event.getEventType().getDisplayName(),
                event.getSeverity(),
                event.getSeverity().getDisplayName(),
                event.getMessage(),
                event.getDetails(),
                event.getSource(),
                event.getUserId(),
                event.getOccurredAt(),
                event.getCreatedAt()
        );
    }
}
