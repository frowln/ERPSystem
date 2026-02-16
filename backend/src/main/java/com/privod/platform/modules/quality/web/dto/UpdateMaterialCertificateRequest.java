package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateMaterialCertificateRequest(
        UUID materialId,

        @Size(max = 500, message = "Наименование материала не должно превышать 500 символов")
        String materialName,

        @Size(max = 100, message = "Номер сертификата не должен превышать 100 символов")
        String certificateNumber,

        MaterialCertificateType certificateType,

        @Size(max = 500, message = "Наименование организации не должно превышать 500 символов")
        String issuedBy,

        LocalDate issuedDate,
        LocalDate expiryDate,

        @Size(max = 1000, message = "URL файла не должен превышать 1000 символов")
        String fileUrl,

        MaterialCertificateStatus status,
        String notes
) {
}
