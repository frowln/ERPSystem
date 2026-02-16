package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalRole;
import com.privod.platform.modules.portal.domain.PortalUser;
import com.privod.platform.modules.portal.domain.PortalUserStatus;

import java.time.Instant;
import java.util.UUID;

public record PortalUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String phone,
        UUID organizationId,
        String organizationName,
        String inn,
        PortalRole portalRole,
        String portalRoleDisplayName,
        PortalUserStatus status,
        String statusDisplayName,
        Instant lastLoginAt,
        UUID invitedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalUserResponse fromEntity(PortalUser user) {
        return new PortalUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getPhone(),
                user.getOrganizationId(),
                user.getOrganizationName(),
                user.getInn(),
                user.getPortalRole(),
                user.getPortalRole().getDisplayName(),
                user.getStatus(),
                user.getStatus().getDisplayName(),
                user.getLastLoginAt(),
                user.getInvitedById(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
