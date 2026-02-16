package com.privod.platform.modules.contractExt.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateLegalDocumentRequest(
        @NotNull(message = "ID судебного дела обязателен")
        UUID caseId,

        @NotBlank(message = "Название документа обязательно")
        @Size(max = 500)
        String title,

        @NotBlank(message = "Тип документа обязателен")
        @Size(max = 100)
        String documentType,

        @NotBlank(message = "Ссылка на файл обязательна")
        @Size(max = 1000)
        String fileUrl,

        UUID uploadedById
) {
}
