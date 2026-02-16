package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.ConstructionPermit;
import com.privod.platform.modules.regulatory.domain.PermitStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ConstructionPermitResponse(
        UUID id,
        UUID projectId,
        String permitNumber,
        String issuedBy,
        LocalDate issuedDate,
        LocalDate expiresDate,
        PermitStatus status,
        String statusDisplayName,
        String permitType,
        String conditions,
        String fileUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ConstructionPermitResponse fromEntity(ConstructionPermit permit) {
        return new ConstructionPermitResponse(
                permit.getId(),
                permit.getProjectId(),
                permit.getPermitNumber(),
                permit.getIssuedBy(),
                permit.getIssuedDate(),
                permit.getExpiresDate(),
                permit.getStatus(),
                permit.getStatus().getDisplayName(),
                permit.getPermitType(),
                permit.getConditions(),
                permit.getFileUrl(),
                permit.getCreatedAt(),
                permit.getUpdatedAt(),
                permit.getCreatedBy()
        );
    }
}
