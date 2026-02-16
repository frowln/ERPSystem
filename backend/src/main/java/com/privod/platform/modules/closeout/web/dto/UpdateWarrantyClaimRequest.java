package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateWarrantyClaimRequest(
        @Size(max = 50)
        String claimNumber,

        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        WarrantyClaimStatus status,

        @Size(max = 100)
        String defectType,

        @Size(max = 500)
        String location,

        UUID assignedToId,

        LocalDate resolvedDate,

        String resolutionDescription,

        @Positive(message = "Стоимость ремонта должна быть положительной")
        BigDecimal costOfRepair,

        String attachmentIds
) {
}
