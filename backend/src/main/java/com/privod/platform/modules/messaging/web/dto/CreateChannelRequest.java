package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.ChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateChannelRequest(
        @NotBlank(message = "Название канала обязательно")
        @Size(max = 255, message = "Название канала не должно превышать 255 символов")
        String name,

        @Size(max = 2000, message = "Описание канала не должно превышать 2000 символов")
        String description,

        @NotNull(message = "Тип канала обязателен")
        ChannelType channelType,

        String avatarUrl,

        UUID projectId,

        List<UUID> memberIds
) {
}
