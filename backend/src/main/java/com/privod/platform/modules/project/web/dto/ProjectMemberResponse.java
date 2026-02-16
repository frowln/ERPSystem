package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectMember;
import com.privod.platform.modules.project.domain.ProjectMemberRole;

import java.time.Instant;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID id,
        UUID projectId,
        UUID userId,
        ProjectMemberRole role,
        Instant joinedAt,
        Instant leftAt
) {
    public static ProjectMemberResponse fromEntity(ProjectMember member) {
        return new ProjectMemberResponse(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                member.getRole(),
                member.getJoinedAt(),
                member.getLeftAt()
        );
    }
}
