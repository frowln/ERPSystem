package com.privod.platform.infrastructure.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Listens to WebSocket session lifecycle events to track active connections
 * and log connection/disconnection activity.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;

    /**
     * Tracks active session IDs mapped to the authenticated username.
     */
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        Principal user = accessor.getUser();

        String username = user != null ? user.getName() : "anonymous";
        activeSessions.put(sessionId, username);

        log.info("WebSocket connected: sessionId={}, user={}, activeSessions={}",
                sessionId, username, activeSessions.size());
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        String username = activeSessions.remove(sessionId);
        if (username != null) {
            log.info("WebSocket disconnected: sessionId={}, user={}, activeSessions={}",
                    sessionId, username, activeSessions.size());
        }
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        Principal user = accessor.getUser();

        log.debug("WebSocket subscription: user={}, destination={}",
                user != null ? user.getName() : "anonymous", destination);
    }

    /**
     * Returns the number of currently active WebSocket sessions.
     */
    public int getActiveSessionCount() {
        return activeSessions.size();
    }

    /**
     * Returns the set of currently active session IDs.
     */
    public Set<String> getActiveSessionIds() {
        return activeSessions.keySet();
    }

    /**
     * Checks whether a specific user has any active WebSocket sessions.
     */
    public boolean isUserOnline(String username) {
        return activeSessions.containsValue(username);
    }
}
