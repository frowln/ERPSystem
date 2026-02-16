package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.UserGroup;

import java.time.Instant;
import java.util.UUID;

public record UserGroupResponse(
        UUID id,
        UUID userId,
        UUID groupId,
        Instant createdAt,
        String createdBy
) {
    public static UserGroupResponse fromEntity(UserGroup userGroup) {
        return new UserGroupResponse(
                userGroup.getId(),
                userGroup.getUserId(),
                userGroup.getGroupId(),
                userGroup.getCreatedAt(),
                userGroup.getCreatedBy()
        );
    }
}
