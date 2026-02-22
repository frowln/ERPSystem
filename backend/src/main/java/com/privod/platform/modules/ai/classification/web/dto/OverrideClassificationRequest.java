package com.privod.platform.modules.ai.classification.web.dto;

import com.privod.platform.modules.ai.classification.domain.DocumentClassType;
import jakarta.validation.constraints.NotNull;

public record OverrideClassificationRequest(
        @NotNull(message = "Новый тип документа обязателен")
        DocumentClassType newType
) {
}
