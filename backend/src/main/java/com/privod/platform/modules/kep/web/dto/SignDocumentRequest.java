package com.privod.platform.modules.kep.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SignDocumentRequest(
        @NotNull(message = "Идентификатор сертификата обязателен")
        UUID certificateId,

        @NotBlank(message = "Модель документа обязательна")
        @Size(max = 100)
        String documentModel,

        @NotNull(message = "Идентификатор документа обязателен")
        UUID documentId,

        @NotBlank(message = "Данные подписи обязательны")
        String signatureData,

        @Size(max = 500)
        String signerName,

        @Size(max = 300)
        String signerPosition
) {
}
