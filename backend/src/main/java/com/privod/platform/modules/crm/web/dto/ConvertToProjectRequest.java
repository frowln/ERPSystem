package com.privod.platform.modules.crm.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ConvertToProjectRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId
) {
}
