package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.MfaMethod;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response returned when MFA is first enabled.
 * Contains sensitive data (secret, backup codes) that is shown to the user exactly once.
 */
public record EnableMfaResponse(
        UUID id,
        UUID userId,
        MfaMethod method,
        String methodDisplayName,
        boolean isEnabled,
        Instant enabledAt,
        String secret,
        String provisioningUri,
        List<String> backupCodes,
        int totalBackupCodes,
        Instant createdAt
) {
}
