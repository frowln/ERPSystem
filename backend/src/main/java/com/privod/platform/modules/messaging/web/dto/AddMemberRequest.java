package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.ChannelMemberRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddMemberRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        String userName,

        ChannelMemberRole role
) {
}
