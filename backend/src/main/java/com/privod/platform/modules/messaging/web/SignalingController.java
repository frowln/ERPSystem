package com.privod.platform.modules.messaging.web;

import com.privod.platform.modules.messaging.web.dto.SignalMessage;
import com.privod.platform.modules.messaging.web.dto.TypingIndicatorMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/signal")
    public void handleSignal(@Payload SignalMessage signal) {
        log.debug("WebRTC signal: type={}, from={}, to={}", signal.type(), signal.fromUserId(), signal.toUserId());
        messagingTemplate.convertAndSendToUser(
                signal.toUserId(),
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
}
