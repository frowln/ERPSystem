package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.ClashSeverity;
import com.privod.platform.modules.bim.domain.ClashType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record CreateBimClashRequest(
        @NotNull(message = "Идентификатор модели A обязателен")
        UUID modelAId,

        UUID modelBId,

        String elementAId,
        String elementBId,

        @NotNull(message = "Тип коллизии обязателен")
        ClashType clashType,

        @NotNull(message = "Серьёзность коллизии обязательна")
        ClashSeverity severity,

        String description,
        Map<String, Object> coordinates
) {
}
