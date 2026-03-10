package com.privod.platform.modules.notification.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight event record representing a real-time notification.
 * Used for WebSocket dispatch and for persisting to the notification_events table.
 *
 * @param id           unique event identifier
 * @param type         notification type (e.g. TASK_ASSIGNED, SAFETY_ALERT)
 * @param title        short human-readable title
 * @param message      longer description text
 * @param targetUserId the user who should receive the notification
 * @param projectId    associated project (nullable for org-wide events)
 * @param entityType   the domain entity kind (e.g. "task", "document", "budget")
 * @param entityId     unique identifier of the affected entity
 * @param createdAt    when the event was produced
 */
public record NotificationEvent(
        UUID id,
        String type,
        String title,
        String message,
        UUID targetUserId,
        UUID projectId,
        String entityType,
        UUID entityId,
        Instant createdAt
) {
    /**
     * Factory method with auto-generated id and timestamp.
     */
    public static NotificationEvent of(String type, String title, String message,
                                        UUID targetUserId, UUID projectId,
                                        String entityType, UUID entityId) {
        return new NotificationEvent(
                UUID.randomUUID(), type, title, message,
                targetUserId, projectId, entityType, entityId,
                Instant.now()
        );
    }
}
