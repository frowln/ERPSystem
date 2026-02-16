package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FollowRecordRequest(
        @NotBlank(message = "Имя модели обязательно")
        String modelName,

        @NotNull(message = "ID записи обязателен")
        UUID recordId,

        UUID channelId,

        String subtypeIds
) {
}
