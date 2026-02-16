package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateWarrantyClaimRequest(
        UUID projectId,

        UUID handoverPackageId,

        @Size(max = 50)
        String claimNumber,

        @NotBlank(message = "Заголовок рекламации обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        @Size(max = 100)
        String defectType,

        @Size(max = 500)
        String location,

        UUID reportedById,

        LocalDate reportedDate,

        LocalDate warrantyExpiryDate,

        UUID assignedToId,

        @Positive(message = "Стоимость ремонта должна быть положительной")
        BigDecimal costOfRepair,

        String attachmentIds
) {
}
