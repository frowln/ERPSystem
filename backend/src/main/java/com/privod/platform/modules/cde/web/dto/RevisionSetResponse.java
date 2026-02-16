package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.RevisionSet;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RevisionSetResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        String revisionIds,
        LocalDate issuedDate,
        UUID issuedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static RevisionSetResponse fromEntity(RevisionSet entity) {
        return new RevisionSetResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getName(),
                entity.getDescription(),
                entity.getRevisionIds(),
                entity.getIssuedDate(),
                entity.getIssuedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
