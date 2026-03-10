package com.privod.platform.modules.notification.web;

import com.privod.platform.modules.notification.service.WebSocketNotificationService;
import com.privod.platform.modules.notification.web.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket controller for client-sent notification messages.
 * <p>
 * Clients send messages to /app/notification.* destinations;
 * responses are delivered to the user's personal queue.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketController {

    private final WebSocketNotificationService webSocketNotificationService;

    /**
     * Handle a client "ping" to confirm the WebSocket connection is alive.
     * Client sends to: /app/notification.ping
     * Response goes to: /user/queue/notifications
     */
    @MessageMapping("/notification.ping")
    @SendToUser("/queue/notifications")
    public WebSocketMessage handlePing(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.debug("Notification ping from user: {}", username);
        return WebSocketMessage.of(
                "PONG", "system", "ping", null,
                "Connection active",
                "WebSocket connection is alive",
                Map.of("user", username)
        );
    }

    /**
     * Handle a client request to mark a notification as acknowledged via WebSocket.
     * Client sends to: /app/notification.ack
     * Response goes to: /user/queue/notifications
     */
    @MessageMapping("/notification.ack")
    @SendToUser("/queue/notifications")
    public WebSocketMessage handleAcknowledge(@Payload Map<String, String> payload, Principal principal) {
        String notificationId = payload.getOrDefault("notificationId", "");
        String username = principal != null ? principal.getName() : "anonymous";
        log.debug("Notification ack from user={}, notificationId={}", username, notificationId);
        return WebSocketMessage.of(
                "ACK", "notification", notificationId, null,
                "Acknowledged",
                "Notification acknowledged",
                Map.of("notificationId", notificationId)
        );
    }
}
