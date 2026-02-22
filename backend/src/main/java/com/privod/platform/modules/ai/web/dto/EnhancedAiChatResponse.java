package com.privod.platform.modules.ai.web.dto;

import java.util.UUID;

public record EnhancedAiChatResponse(
        String reply,
        UUID conversationId,
        int tokensUsed,
        long responseTimeMs,
        String model,
        String provider
) {
}
