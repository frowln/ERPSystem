package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.ModelAccess;

import java.time.Instant;
import java.util.UUID;

public record ModelAccessResponse(
        UUID id,
        String modelName,
        UUID groupId,
        boolean canRead,
        boolean canCreate,
        boolean canUpdate,
        boolean canDelete,
        Instant createdAt,
        Instant updatedAt
) {
    public static ModelAccessResponse fromEntity(ModelAccess access) {
        return new ModelAccessResponse(
                access.getId(),
                access.getModelName(),
                access.getGroupId(),
                access.isCanRead(),
                access.isCanCreate(),
                access.isCanUpdate(),
                access.isCanDelete(),
                access.getCreatedAt(),
                access.getUpdatedAt()
        );
    }
}
