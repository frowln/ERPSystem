package com.privod.platform.modules.kep.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateKepCertificateRequest(
        @NotNull(message = "Владелец сертификата обязателен")
        UUID ownerId,

        @NotBlank(message = "Имя владельца обязательно")
        @Size(max = 500)
        String ownerName,

        @NotBlank(message = "Серийный номер обязателен")
        @Size(max = 100)
        String serialNumber,

        @NotBlank(message = "Издатель обязателен")
        @Size(max = 500)
        String issuer,

        @NotNull(message = "Дата начала действия обязательна")
        LocalDateTime validFrom,

        @NotNull(message = "Дата окончания действия обязательна")
        LocalDateTime validTo,

        @NotBlank(message = "Отпечаток сертификата обязателен")
        @Size(max = 100)
        String thumbprint,

        @Size(max = 500)
        String subjectCn,

        @Size(max = 500)
        String subjectOrg,

        @Size(max = 20)
        String subjectInn,

        @Size(max = 20)
        String subjectOgrn,

        String certificateData,

        Boolean qualified
) {
}
