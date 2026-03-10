package com.privod.platform.modules.auth.web.dto;

public record TwoFactorSetupResponse(
        String secret,
        String qrCodeUri
) {
}
