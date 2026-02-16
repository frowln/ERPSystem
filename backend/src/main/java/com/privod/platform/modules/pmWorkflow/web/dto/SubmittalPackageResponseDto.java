package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.SubmittalPackage;

import java.time.Instant;
import java.util.UUID;

public record SubmittalPackageResponseDto(
        UUID id,
        UUID projectId,
        String packageNumber,
        String title,
        String description,
        String submittalIds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SubmittalPackageResponseDto fromEntity(SubmittalPackage entity) {
        return new SubmittalPackageResponseDto(
                entity.getId(),
                entity.getProjectId(),
                entity.getPackageNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getSubmittalIds(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
