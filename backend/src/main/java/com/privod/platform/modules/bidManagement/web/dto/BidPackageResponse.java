package com.privod.platform.modules.bidManagement.web.dto;

import com.privod.platform.modules.bidManagement.domain.BidPackage;
import com.privod.platform.modules.bidManagement.domain.BidPackageStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record BidPackageResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String name,
        String description,
        BidPackageStatus status,
        LocalDateTime bidDueDate,
        String scopeOfWork,
        String specSections,
        long invitationCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static BidPackageResponse fromEntity(BidPackage entity, long invitationCount) {
        return new BidPackageResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getBidDueDate(),
                entity.getScopeOfWork(),
                entity.getSpecSections(),
                invitationCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static BidPackageResponse fromEntity(BidPackage entity) {
        return fromEntity(entity, 0);
    }
}
