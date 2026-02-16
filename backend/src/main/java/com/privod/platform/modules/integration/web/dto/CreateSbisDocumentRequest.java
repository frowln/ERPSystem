package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SbisDirection;
import com.privod.platform.modules.integration.domain.SbisDocumentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSbisDocumentRequest(
        @NotNull(message = "Тип документа обязателен")
        SbisDocumentType documentType,

        UUID internalDocumentId,

        @Size(max = 100, message = "Модель документа не должна превышать 100 символов")
        String internalDocumentModel,

        @Size(max = 12, message = "ИНН контрагента не должен превышать 12 символов")
        String partnerInn,

        @Size(max = 9, message = "КПП контрагента не должен превышать 9 символов")
        String partnerKpp,

        @Size(max = 500, message = "Название контрагента не должно превышать 500 символов")
        String partnerName,

        @NotNull(message = "Направление документа обязательно")
        SbisDirection direction,

        String documentData
) {
}
