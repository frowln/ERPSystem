package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.ArchivePolicy;

import java.time.Instant;
import java.util.UUID;

public record ArchivePolicyResponse(
        UUID id,
        String name,
        String description,
        String classification,
        int retentionDays,
        boolean autoArchive,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static ArchivePolicyResponse fromEntity(ArchivePolicy entity) {
        return new ArchivePolicyResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getClassification() != null ? entity.getClassification().name() : null,
                entity.getRetentionDays(),
                entity.isAutoArchive(),
                entity.isEnabled(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
