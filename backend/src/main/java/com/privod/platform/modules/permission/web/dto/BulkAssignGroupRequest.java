package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record BulkAssignGroupRequest(
        @NotEmpty(message = "Список пользователей не должен быть пустым")
        List<UUID> userIds,

        @NotNull(message = "ID группы обязателен")
        UUID groupId
) {
}
