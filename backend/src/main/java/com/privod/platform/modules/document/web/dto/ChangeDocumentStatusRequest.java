package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.DocumentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeDocumentStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        DocumentStatus status
) {
}
