package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentClassification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDocumentContainerRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Номер документа обязателен")
        @Size(max = 100, message = "Номер документа не должен превышать 100 символов")
        String documentNumber,

        @NotBlank(message = "Название документа обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        DocumentClassification classification,

        @Size(max = 100)
        String discipline,

        @Size(max = 100)
        String zone,

        @Size(max = 50)
        String level,

        @Size(max = 50)
        String originatorCode,

        @Size(max = 50)
        String typeCode,

        String metadata,

        String tags
) {
}
