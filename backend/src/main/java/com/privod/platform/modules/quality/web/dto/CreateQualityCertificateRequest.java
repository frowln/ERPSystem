package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateQualityCertificateRequest(
        UUID materialId,
        UUID supplierId,

        @Size(max = 500, message = "Наименование поставщика не должно превышать 500 символов")
        String supplierName,

        @NotBlank(message = "Номер сертификата обязателен")
        @Size(max = 100, message = "Номер сертификата не должен превышать 100 символов")
        String certificateNumber,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issueDate,

        LocalDate expiryDate,

        @NotNull(message = "Тип сертификата обязателен")
        CertificateType certificateType,

        @Size(max = 1000, message = "URL файла не должен превышать 1000 символов")
        String fileUrl
) {
}
