package com.privod.platform.modules.apiManagement.web.dto;

public record TopEndpointResponse(
        String endpoint,
        long requestCount
) {
}
