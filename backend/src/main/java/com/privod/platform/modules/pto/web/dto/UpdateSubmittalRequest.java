package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateSubmittalRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        SubmittalType submittalType,

        String description,

        UUID submittedById,

        LocalDate dueDate,

        String specSection,

        UUID specItemId,

        UUID currentReviewerId,

        Integer leadTime,

        LocalDate requiredDate
) {
}
