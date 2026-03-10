package com.privod.platform.modules.auth.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserResponse user,
        boolean requiresTwoFactor,
        String tempToken
) {
    /** Backward-compatible constructor without 2FA fields */
    public LoginResponse(String accessToken, String refreshToken, long expiresIn, UserResponse user) {
        this(accessToken, refreshToken, expiresIn, user, false, null);
    }
}
