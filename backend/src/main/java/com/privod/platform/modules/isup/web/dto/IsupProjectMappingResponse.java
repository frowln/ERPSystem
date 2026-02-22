package com.privod.platform.modules.isup.web.dto;

import com.privod.platform.modules.isup.domain.IsupProjectMapping;

import java.time.Instant;
import java.util.UUID;

public record IsupProjectMappingResponse(
        UUID id,
        UUID organizationId,
        UUID privodProjectId,
        String isupProjectId,
        String isupObjectId,
        String governmentContractNumber,
        String registrationNumber,
        boolean syncEnabled,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IsupProjectMappingResponse fromEntity(IsupProjectMapping entity) {
        return new IsupProjectMappingResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getPrivodProjectId(),
                entity.getIsupProjectId(),
                entity.getIsupObjectId(),
                entity.getGovernmentContractNumber(),
                entity.getRegistrationNumber(),
                entity.isSyncEnabled(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
