package com.privod.platform.modules.kep.web.dto;

import com.privod.platform.modules.kep.domain.KepPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSigningRequestRequest(
        @NotBlank(message = "Модель документа обязательна")
        @Size(max = 100)
        String documentModel,

        @NotNull(message = "Идентификатор документа обязателен")
        UUID documentId,

        @Size(max = 500)
        String documentTitle,

        @NotNull(message = "Инициатор запроса обязателен")
        UUID requesterId,

        @NotNull(message = "Подписант обязателен")
        UUID signerId,

        LocalDate dueDate,

        KepPriority priority
) {
}
