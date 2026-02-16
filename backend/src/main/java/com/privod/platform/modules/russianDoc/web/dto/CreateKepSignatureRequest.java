package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateKepSignatureRequest(
        @NotBlank(message = "Тип документа обязателен")
        String documentType,

        @NotNull(message = "ID документа обязателен")
        UUID documentId,

        @NotNull(message = "ID сертификата обязателен")
        UUID certificateId,

        @NotNull(message = "ID подписанта обязателен")
        UUID signedById,

        String signatureData
) {
}
