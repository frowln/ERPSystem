package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.notification.web.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Service responsible for dispatching real-time WebSocket messages to clients.
 * <p>
 * Destination patterns:
 * <ul>
 *   <li>/user/{username}/queue/notifications - personal notifications for a user</li>
 *   <li>/topic/project.{projectId} - project-wide events visible to all project members</li>
 *   <li>/topic/broadcast - platform-wide announcements sent to every connected client</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    // ── Personal notifications ──────────────────────────────────────────────

    /**
     * Send a message to a specific user's personal notification queue.
     *
     * @param username     the Spring Security principal name (email) of the target user
     * @param notification the message to deliver
     */
    public void sendToUser(String username, WebSocketMessage notification) {
        log.debug("Sending personal notification to user={}: type={}", username, notification.type());
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification);
    }

    /**
     * Overload that accepts a userId (UUID) and resolves username via the caller.
     * For cases where the caller already has the email/username handy, prefer
     * {@link #sendToUser(String, WebSocketMessage)}.
     */
    public void sendToUser(UUID userId, String username, WebSocketMessage notification) {
        sendToUser(username, notification);
    }

    // ── Project-scoped events ───────────────────────────────────────────────

    /**
     * Broadcast an event to everyone subscribed to a specific project.
     *
     * @param projectId the project UUID
     * @param event     the message payload
     */
    public void sendToProject(UUID projectId, WebSocketMessage event) {
        String destination = "/topic/project." + projectId;
        log.debug("Sending project event: projectId={}, type={}", projectId, event.type());
        messagingTemplate.convertAndSend(destination, event);
    }

    /**
     * String-based overload for project events.
     */
    public void sendToProject(String projectId, WebSocketMessage event) {
        String destination = "/topic/project." + projectId;
        log.debug("Sending project event: projectId={}, type={}", projectId, event.type());
        messagingTemplate.convertAndSend(destination, event);
    }

    // ── Platform-wide broadcasts ────────────────────────────────────────────

    /**
     * Send a message to every connected client (e.g. system announcements).
     *
     * @param event the message payload
     */
    public void sendToAll(WebSocketMessage event) {
        log.debug("Broadcasting event to all: type={}", event.type());
        messagingTemplate.convertAndSend("/topic/broadcast", event);
    }

    // ── Domain-specific convenience methods ─────────────────────────────────

    /**
     * Notify project members about a new RFI (Request for Information).
     */
    public void notifyNewRfi(UUID projectId, String rfiId, String rfiSubject, String createdBy) {
        WebSocketMessage msg = WebSocketMessage.of(
                "NOTIFICATION", "rfi", rfiId, projectId.toString(),
                "New RFI: " + rfiSubject,
                "A new RFI has been created by " + createdBy,
                Map.of("createdBy", createdBy));
        sendToProject(projectId, msg);
    }

    /**
     * Notify project members about a status change on any entity.
     */
    public void notifyStatusChange(UUID projectId, String entityType, String entityId,
                                   String entityTitle, String oldStatus, String newStatus) {
        WebSocketMessage msg = WebSocketMessage.statusChange(
                entityType, entityId, projectId.toString(), entityTitle, oldStatus, newStatus);
        sendToProject(projectId, msg);
    }

    /**
     * Notify project members about a new comment.
     */
    public void notifyNewComment(UUID projectId, String entityType, String entityId,
                                 String entityTitle, String commenterName) {
        WebSocketMessage msg = WebSocketMessage.of(
                "NEW_COMMENT", entityType, entityId, projectId.toString(),
                "New comment on: " + entityTitle,
                commenterName + " added a comment",
                Map.of("commenterName", commenterName));
        sendToProject(projectId, msg);
    }

    /**
     * Notify project members about a new document upload.
     */
    public void notifyDocumentUpload(UUID projectId, String documentId,
                                     String documentName, String uploadedBy) {
        WebSocketMessage msg = WebSocketMessage.of(
                "DOCUMENT_UPLOAD", "document", documentId, projectId.toString(),
                "New document: " + documentName,
                uploadedBy + " uploaded a new document",
                Map.of("documentName", documentName, "uploadedBy", uploadedBy));
        sendToProject(projectId, msg);
    }

    /**
     * Send a high-priority safety alert to all project members and broadcast.
     */
    public void notifySafetyAlert(UUID projectId, String inspectionId,
                                  String title, String severity) {
        WebSocketMessage msg = WebSocketMessage.safetyAlert(
                inspectionId, projectId.toString(), title, severity,
                "Safety alert (" + severity + "): " + title);
        sendToProject(projectId, msg);

        // Critical severity alerts also go to the global broadcast
        if ("CRITICAL".equalsIgnoreCase(severity)) {
            sendToAll(msg);
        }
    }
}
