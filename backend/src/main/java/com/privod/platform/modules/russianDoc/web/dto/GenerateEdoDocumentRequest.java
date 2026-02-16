package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GenerateEdoDocumentRequest(
        @NotNull(message = "ID шаблона обязателен")
        UUID templateId,

        @NotBlank(message = "Тип исходного документа обязателен")
        String sourceDocumentType,

        @NotNull(message = "ID исходного документа обязателен")
        UUID sourceDocumentId
) {
}
