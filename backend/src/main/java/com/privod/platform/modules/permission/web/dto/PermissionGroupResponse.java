package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.PermissionGroup;

import java.time.Instant;
import java.util.UUID;

public record PermissionGroupResponse(
        UUID id,
        String name,
        String displayName,
        String description,
        String category,
        UUID parentGroupId,
        boolean isActive,
        int sequence,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PermissionGroupResponse fromEntity(PermissionGroup group) {
        return new PermissionGroupResponse(
                group.getId(),
                group.getName(),
                group.getDisplayName(),
                group.getDescription(),
                group.getCategory(),
                group.getParentGroupId(),
                group.isActive(),
                group.getSequence(),
                group.getCreatedAt(),
                group.getUpdatedAt(),
                group.getCreatedBy()
        );
    }
}
