package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.ConsentType;
import com.privod.platform.modules.compliance.domain.LegalBasis;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDataConsentRequest(
        @NotNull(message = "Тип согласия обязателен")
        ConsentType consentType,

        @NotNull(message = "Правовое основание обязательно")
        LegalBasis legalBasis,

        @NotBlank(message = "Цель обработки обязательна")
        String purpose,

        String dataCategories,

        Integer retentionDays,

        String consentVersion
) {
}
