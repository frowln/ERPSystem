package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.MaterialCertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateMaterialCertificateRequest(
        @NotNull(message = "Идентификатор материала обязателен")
        UUID materialId,

        @Size(max = 500, message = "Наименование материала не должно превышать 500 символов")
        String materialName,

        @NotBlank(message = "Номер сертификата обязателен")
        @Size(max = 100, message = "Номер сертификата не должен превышать 100 символов")
        String certificateNumber,

        @NotNull(message = "Тип сертификата обязателен")
        MaterialCertificateType certificateType,

        @Size(max = 500, message = "Наименование организации не должно превышать 500 символов")
        String issuedBy,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issuedDate,

        LocalDate expiryDate,

        @Size(max = 1000, message = "URL файла не должен превышать 1000 символов")
        String fileUrl,

        String notes
) {
}
