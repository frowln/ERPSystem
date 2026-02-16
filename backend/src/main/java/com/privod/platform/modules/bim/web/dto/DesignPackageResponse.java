package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DesignDiscipline;
import com.privod.platform.modules.bim.domain.DesignPackage;
import com.privod.platform.modules.bim.domain.DesignPackageStatus;

import java.time.Instant;
import java.util.UUID;

public record DesignPackageResponse(
        UUID id,
        UUID projectId,
        String code,
        String name,
        DesignDiscipline discipline,
        String disciplineDisplayName,
        DesignPackageStatus status,
        String statusDisplayName,
        Integer packageVersion,
        UUID approvedById,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DesignPackageResponse fromEntity(DesignPackage entity) {
        return new DesignPackageResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getName(),
                entity.getDiscipline(),
                entity.getDiscipline().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getPackageVersion(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
