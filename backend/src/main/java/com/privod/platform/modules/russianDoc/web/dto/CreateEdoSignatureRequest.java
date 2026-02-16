package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateEdoSignatureRequest(
        @NotNull(message = "ID документа ЭДО обязателен")
        UUID edoDocumentId,

        UUID signerId,

        @NotBlank(message = "ФИО подписанта обязательно")
        @Size(max = 500, message = "ФИО не должно превышать 500 символов")
        String signerName,

        @Size(max = 500, message = "Должность не должна превышать 500 символов")
        String signerPosition,

        @Size(max = 255, message = "Серийный номер сертификата не должен превышать 255 символов")
        String certificateSerialNumber,

        String signatureData
) {
}
