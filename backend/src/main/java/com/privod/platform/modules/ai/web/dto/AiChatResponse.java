package com.privod.platform.modules.ai.web.dto;

import java.util.UUID;

public record AiChatResponse(
        String reply,
        UUID conversationId,
        int tokensUsed,
        String model
) {
}
