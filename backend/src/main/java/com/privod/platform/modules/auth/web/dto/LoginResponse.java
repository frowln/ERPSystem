package com.privod.platform.modules.auth.web.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserResponse user
) {
}
