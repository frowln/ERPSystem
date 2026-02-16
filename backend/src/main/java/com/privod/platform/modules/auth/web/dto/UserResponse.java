package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.User;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String phone,
        String position,
        String avatarUrl,
        boolean enabled,
        UUID organizationId,
        Set<String> roles,
        Instant createdAt
) {
    public static UserResponse fromUser(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getPhone(),
                user.getPosition(),
                user.getAvatarUrl(),
                user.isEnabled(),
                user.getOrganizationId(),
                user.getRoles().stream()
                        .map(role -> role.getCode())
                        .collect(Collectors.toSet()),
                user.getCreatedAt()
        );
    }
}
