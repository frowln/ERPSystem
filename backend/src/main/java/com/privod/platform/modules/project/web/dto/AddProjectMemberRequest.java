package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddProjectMemberRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        @NotNull(message = "Role is required")
        ProjectMemberRole role
) {
}
