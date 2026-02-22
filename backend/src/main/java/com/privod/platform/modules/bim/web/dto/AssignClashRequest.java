package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignClashRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId
) {
}
