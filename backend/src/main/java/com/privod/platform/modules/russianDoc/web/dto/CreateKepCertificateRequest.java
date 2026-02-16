package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateKepCertificateRequest(
        @NotBlank(message = "Владелец сертификата обязателен")
        @Size(max = 500)
        String owner,

        @NotBlank(message = "Серийный номер обязателен")
        @Size(max = 200)
        String serialNumber,

        @NotBlank(message = "Издатель обязателен")
        @Size(max = 500)
        String issuer,

        @NotNull(message = "Дата начала действия обязательна")
        LocalDate validFrom,

        @NotNull(message = "Дата окончания действия обязательна")
        LocalDate validTo,

        @NotBlank(message = "Отпечаток обязателен")
        @Size(max = 200)
        String thumbprint,

        String certificateData,

        UUID organizationId
) {
}
