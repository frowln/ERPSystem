package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Discipline;
import com.privod.platform.modules.pto.domain.PtoDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePtoDocumentRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название документа обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @NotNull(message = "Тип документа обязателен")
        PtoDocumentType documentType,

        Discipline discipline,

        String notes
) {
}
