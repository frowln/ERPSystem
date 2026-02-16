package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateChannelRequest(
        @Size(max = 255, message = "Название канала не должно превышать 255 символов")
        String name,

        @Size(max = 2000, message = "Описание канала не должно превышать 2000 символов")
        String description,

        String avatarUrl
) {
}
