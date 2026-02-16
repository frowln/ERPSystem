package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.CallType;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateCallRequest(
        String title,
        UUID projectId,
        UUID channelId,
        @NotNull(message = "Тип звонка обязателен")
        CallType callType,
        @NotNull(message = "Инициатор обязателен")
        UUID initiatorId,
        String initiatorName,
        List<UUID> inviteeIds,
        String metadataJson
) {
}
