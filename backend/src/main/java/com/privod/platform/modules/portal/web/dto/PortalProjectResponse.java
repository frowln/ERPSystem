package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalAccessLevel;
import com.privod.platform.modules.portal.domain.PortalProject;

import java.time.Instant;
import java.util.UUID;

public record PortalProjectResponse(
        UUID id,
        UUID portalUserId,
        UUID projectId,
        PortalAccessLevel accessLevel,
        String accessLevelDisplayName,
        boolean canViewFinance,
        boolean canViewDocuments,
        boolean canViewSchedule,
        boolean canViewPhotos,
        UUID grantedById,
        Instant grantedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalProjectResponse fromEntity(PortalProject pp) {
        return new PortalProjectResponse(
                pp.getId(),
                pp.getPortalUserId(),
                pp.getProjectId(),
                pp.getAccessLevel(),
                pp.getAccessLevel().getDisplayName(),
                pp.isCanViewFinance(),
                pp.isCanViewDocuments(),
                pp.isCanViewSchedule(),
                pp.isCanViewPhotos(),
                pp.getGrantedById(),
                pp.getGrantedAt(),
                pp.getCreatedAt(),
                pp.getUpdatedAt()
        );
    }
}
