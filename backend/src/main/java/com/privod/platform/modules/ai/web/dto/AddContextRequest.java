package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiContextType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddContextRequest(
        @NotNull(message = "Тип контекста обязателен")
        AiContextType contextType,

        UUID entityId,

        String entityName
) {
}
