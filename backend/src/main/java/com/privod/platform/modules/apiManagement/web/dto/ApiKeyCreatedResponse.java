package com.privod.platform.modules.apiManagement.web.dto;

import java.util.UUID;

public record ApiKeyCreatedResponse(
        UUID id,
        String name,
        String prefix,
        String rawKey,
        String message
) {
}
