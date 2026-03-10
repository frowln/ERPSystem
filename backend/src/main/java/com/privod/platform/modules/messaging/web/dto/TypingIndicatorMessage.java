package com.privod.platform.modules.messaging.web.dto;

import java.util.UUID;

public record TypingIndicatorMessage(
    UUID channelId,
    UUID userId,
    String userName,
    boolean isTyping
) {}
