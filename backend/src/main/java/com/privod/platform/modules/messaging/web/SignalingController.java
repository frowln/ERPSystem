package com.privod.platform.modules.messaging.web;

import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.web.dto.SignalMessage;
import com.privod.platform.modules.messaging.web.dto.TypingIndicatorMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Resolve WebSocket principal name (email) from user UUID.
     * Spring STOMP routes /user/{principal}/queue/... by authentication principal,
     * which is the email (set in WebSocketAuthInterceptor from JWT subject).
     */
    private String resolveWsPrincipal(String userId) {
        try {
            return userRepository.findById(UUID.fromString(userId))
                    .map(User::getEmail)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Cannot resolve WS principal for userId {}: {}", userId, e.getMessage());
            return null;
        }
    }

    @MessageMapping("/signal")
    public void handleSignal(@Payload SignalMessage signal) {
        log.debug("WebRTC signal: type={}, from={}, to={}", signal.type(), signal.fromUserId(), signal.toUserId());
        String principal = resolveWsPrincipal(signal.toUserId());
        if (principal == null) {
            log.warn("Cannot route signal to user {}: user not found", signal.toUserId());
            return;
        }
        messagingTemplate.convertAndSendToUser(
                principal,
                "/queue/signal",
                signal
        );
    }

    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingIndicatorMessage typing) {
        log.debug("Typing indicator: channel={}, user={}, isTyping={}",
                typing.channelId(), typing.userName(), typing.isTyping());
        messagingTemplate.convertAndSend(
                "/topic/channel." + typing.channelId() + ".typing",
                typing
        );
    }

    /**
     * Handle read receipt events from clients.
     * When a user reads messages in a channel, broadcast the read status
     * to all subscribers of that channel so their UI updates the checkmarks.
     */
    @MessageMapping("/read")
    public void handleReadReceipt(@Payload Map<String, Object> payload) {
        String channelId = String.valueOf(payload.getOrDefault("channelId", ""));
        String userId = String.valueOf(payload.getOrDefault("userId", ""));
        String status = String.valueOf(payload.getOrDefault("status", "read"));

        if (channelId.isEmpty() || userId.isEmpty()) {
            log.debug("Invalid read receipt payload: {}", payload);
            return;
        }

        log.debug("Read receipt: channel={}, user={}, status={}", channelId, userId, status);

        // Broadcast to channel so other users see the read status update
        messagingTemplate.convertAndSend(
                "/topic/channel." + channelId + ".read",
                Map.of(
                        "userId", userId,
                        "messageId", payload.getOrDefault("messageId", ""),
                        "status", status
                )
        );
    }
}
