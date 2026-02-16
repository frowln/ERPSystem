package com.privod.platform.modules.project.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateProjectCollaboratorRequest(
        @NotNull(message = "ID партнёра обязательно")
        UUID partnerId,

        @Size(max = 100)
        String role
) {
}
