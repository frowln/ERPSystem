package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.EdoDocumentType;
import com.privod.platform.modules.integration.domain.EdoProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendEdoDocumentRequest(
        @NotNull(message = "Провайдер ЭДО обязателен")
        EdoProvider provider,

        @NotNull(message = "Тип документа обязателен")
        EdoDocumentType documentType,

        @NotBlank(message = "Заголовок документа обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @Size(max = 12, message = "ИНН получателя не должен превышать 12 символов")
        String recipientInn,

        @Size(max = 500, message = "Название получателя не должно превышать 500 символов")
        String recipientName,

        @Size(max = 1000, message = "URL файла не должен превышать 1000 символов")
        String fileUrl,

        String linkedEntityType,

        UUID linkedEntityId
) {
}
