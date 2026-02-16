package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.SecurityPolicy;

import java.util.List;
import java.util.UUID;

public record SecurityPolicyResponse(
        UUID id,
        String name,
        int passwordMinLength,
        boolean passwordRequiresUppercase,
        boolean passwordRequiresNumber,
        boolean passwordRequiresSpecial,
        int passwordExpiryDays,
        int maxLoginAttempts,
        int lockoutDurationMinutes,
        int sessionTimeoutMinutes,
        boolean requireMfa,
        List<String> allowedIpRanges,
        boolean isActive
) {
    public static SecurityPolicyResponse fromEntity(SecurityPolicy entity) {
        return new SecurityPolicyResponse(
                entity.getId(),
                entity.getName(),
                entity.getPasswordMinLength(),
                entity.isPasswordRequiresUppercase(),
                entity.isPasswordRequiresNumber(),
                entity.isPasswordRequiresSpecial(),
                entity.getPasswordExpiryDays(),
                entity.getMaxLoginAttempts(),
                entity.getLockoutDurationMinutes(),
                entity.getSessionTimeoutMinutes(),
                entity.isRequireMfa(),
                entity.getAllowedIpRanges(),
                entity.isActive()
        );
    }
}
