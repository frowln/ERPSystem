package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignGroupRequest(
        @NotNull(message = "ID пользователя обязателен")
        UUID userId,

        @NotNull(message = "ID группы обязателен")
        UUID groupId
) {
}
