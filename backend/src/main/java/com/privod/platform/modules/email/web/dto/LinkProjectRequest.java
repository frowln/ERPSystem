package com.privod.platform.modules.email.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LinkProjectRequest(
        @NotNull(message = "projectId обязателен")
        UUID projectId
) {
}
