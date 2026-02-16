package com.privod.platform.modules.portal.web.dto;

public record PortalLoginResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        PortalUserResponse user
) {
}
