package com.privod.platform.modules.notification.web.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Envelope for all WebSocket messages sent to clients.
 *
 * @param type       message category, e.g. "NOTIFICATION", "STATUS_CHANGE",
 *                   "NEW_COMMENT", "DOCUMENT_UPLOAD", "SAFETY_ALERT"
 * @param entityType the domain entity kind, e.g. "rfi", "issue", "document",
 *                   "daily_log", "safety_inspection"
 * @param entityId   unique identifier of the affected entity
 * @param projectId  project scope (nullable for org-wide messages)
 * @param title      short human-readable title
 * @param message    longer description text
 * @param data       arbitrary additional payload (key-value pairs)
 * @param timestamp  when the event was produced
 */
public record WebSocketMessage(
        String type,
        String entityType,
        String entityId,
        String projectId,
        String title,
        String message,
        Map<String, Object> data,
        Instant timestamp
) {

    /**
     * Convenience factory for quick construction with auto-timestamp.
     */
    public static WebSocketMessage of(String type, String entityType, String entityId,
                                       String projectId, String title, String message,
                                       Map<String, Object> data) {
        return new WebSocketMessage(type, entityType, entityId, projectId,
                title, message, data, Instant.now());
    }

    /**
     * Convenience factory for simple notifications without extra data.
     */
    public static WebSocketMessage notification(String entityType, String entityId,
                                                 String projectId, String title, String message) {
        return of("NOTIFICATION", entityType, entityId, projectId, title, message, Map.of());
    }

    /**
     * Factory for status-change events.
     */
    public static WebSocketMessage statusChange(String entityType, String entityId,
                                                  String projectId, String title,
                                                  String oldStatus, String newStatus) {
        return of("STATUS_CHANGE", entityType, entityId, projectId, title,
                "Status changed from " + oldStatus + " to " + newStatus,
                Map.of("oldStatus", oldStatus, "newStatus", newStatus));
    }

    /**
     * Factory for safety-alert events.
     */
    public static WebSocketMessage safetyAlert(String entityId, String projectId,
                                                String title, String severity, String message) {
        return of("SAFETY_ALERT", "safety_inspection", entityId, projectId, title, message,
                Map.of("severity", severity));
    }
}
