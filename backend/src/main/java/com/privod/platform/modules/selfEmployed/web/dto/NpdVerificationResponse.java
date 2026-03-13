package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.NpdStatus;

import java.time.Instant;

public record NpdVerificationResponse(
        String inn,
        NpdStatus status,
        String statusDisplayName,
        Instant verifiedAt,
        String message
) {
}
