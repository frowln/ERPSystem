package com.privod.platform.modules.ai.web.dto;

public record AiStatusResponse(
        boolean configured,
        String provider,
        String model,
        String message
) {
}
