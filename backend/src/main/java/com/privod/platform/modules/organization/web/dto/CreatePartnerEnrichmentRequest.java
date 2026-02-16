package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.EnrichmentSource;
import com.privod.platform.modules.organization.domain.PartnerLegalStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePartnerEnrichmentRequest(
        @NotNull(message = "Идентификатор партнёра обязателен")
        UUID partnerId,

        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String inn,

        @Size(max = 15, message = "ОГРН не должен превышать 15 символов")
        String ogrn,

        @Size(max = 9, message = "КПП не должен превышать 9 символов")
        String kpp,

        @Size(max = 500, message = "Юр. наименование не должно превышать 500 символов")
        String legalName,

        @Size(max = 500, message = "Торговое наименование не должно превышать 500 символов")
        String tradeName,

        String legalAddress,
        String actualAddress,
        LocalDate registrationDate,
        PartnerLegalStatus status,
        BigDecimal authorizedCapital,
        String ceoName,
        String ceoInn,
        Integer employeeCount,
        String mainActivity,
        String okvedCode,
        EnrichmentSource source,

        @Min(value = 0, message = "Оценка надёжности не может быть меньше 0")
        @Max(value = 100, message = "Оценка надёжности не может быть больше 100")
        Integer reliabilityScore
) {
}
