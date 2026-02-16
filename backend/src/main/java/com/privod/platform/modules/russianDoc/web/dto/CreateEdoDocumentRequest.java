package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEdoDocumentRequest(
        @NotBlank(message = "Номер документа обязателен")
        @Size(max = 100, message = "Номер документа не должен превышать 100 символов")
        String documentNumber,

        @NotNull(message = "Дата документа обязательна")
        LocalDate documentDate,

        @NotNull(message = "Тип документа обязателен")
        EdoEnhancedDocumentType documentType,

        UUID senderId,

        @Size(max = 12, message = "ИНН отправителя не должен превышать 12 символов")
        String senderInn,

        UUID receiverId,

        @Size(max = 12, message = "ИНН получателя не должен превышать 12 символов")
        String receiverInn,

        BigDecimal amount,

        BigDecimal vatAmount,

        BigDecimal totalAmount,

        UUID linkedDocumentId,

        @Size(max = 100, message = "Модель связанного документа не должна превышать 100 символов")
        String linkedDocumentModel,

        @Size(max = 2000, message = "URL файла не должен превышать 2000 символов")
        String fileUrl,

        String xmlData
) {
}
