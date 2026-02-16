package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.quality.domain.MaterialCertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateMaterialCertificateRequest(
        @NotNull(message = "ID материала обязателен")
        UUID materialId,

        String materialName,

        @NotBlank(message = "Номер сертификата обязателен")
        String certificateNumber,

        @NotNull(message = "Тип сертификата обязателен")
        MaterialCertificateType certificateType,

        String issuedBy,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issuedDate,

        LocalDate expiryDate,

        String fileUrl,

        String notes
) {
}
