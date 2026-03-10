package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.project.domain.ProjectMember;
import com.privod.platform.modules.project.domain.ProjectMemberRole;

import java.time.Instant;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID id,
        UUID projectId,
        UUID userId,
        String userName,
        String userEmail,
        ProjectMemberRole role,
        Instant joinedAt,
        Instant leftAt
) {
    public static ProjectMemberResponse fromEntity(ProjectMember member) {
        return new ProjectMemberResponse(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                null,
                null,
                member.getRole(),
                member.getJoinedAt(),
                member.getLeftAt()
        );
    }

    public static ProjectMemberResponse fromEntity(ProjectMember member, User user) {
        return new ProjectMemberResponse(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                user != null ? user.getFullName() : null,
                user != null ? user.getEmail() : null,
                member.getRole(),
                member.getJoinedAt(),
                member.getLeftAt()
        );
    }
}
