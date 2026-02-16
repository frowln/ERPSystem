package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.FieldAccess;

import java.time.Instant;
import java.util.UUID;

public record FieldAccessResponse(
        UUID id,
        String modelName,
        String fieldName,
        UUID groupId,
        boolean canRead,
        boolean canWrite,
        Instant createdAt,
        Instant updatedAt
) {
    public static FieldAccessResponse fromEntity(FieldAccess access) {
        return new FieldAccessResponse(
                access.getId(),
                access.getModelName(),
                access.getFieldName(),
                access.getGroupId(),
                access.isCanRead(),
                access.isCanWrite(),
                access.getCreatedAt(),
                access.getUpdatedAt()
        );
    }
}
