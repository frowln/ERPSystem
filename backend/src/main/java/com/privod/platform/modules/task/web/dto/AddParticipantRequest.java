package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ParticipantRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddParticipantRequest(
        @NotNull(message = "ID пользователя обязателен")
        UUID userId,

        String userName,

        @NotNull(message = "Роль обязательна")
        ParticipantRole role
) {
}
