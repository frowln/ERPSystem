package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.CertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateCertificateRequest(
        @NotNull(message = "Тип сертификата обязателен")
        CertificateType certificateType,

        @NotBlank(message = "Наименование сертификата обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 100)
        String number,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issuedDate,

        LocalDate expiryDate,

        @Size(max = 500)
        String issuedBy,

        String notes
) {
}
