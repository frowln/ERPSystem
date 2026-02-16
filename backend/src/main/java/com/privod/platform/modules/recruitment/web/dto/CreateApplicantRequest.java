package com.privod.platform.modules.recruitment.web.dto;

import com.privod.platform.modules.recruitment.domain.ApplicantPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateApplicantRequest(

        @NotBlank(message = "Имя кандидата обязательно")
        @Size(max = 255, message = "Имя не должно превышать 255 символов")
        String partnerName,

        @Size(max = 255)
        String email,

        @Size(max = 50)
        String phone,

        UUID jobPositionId,
        UUID stageId,

        @Size(max = 255)
        String source,

        @Size(max = 255)
        String medium,

        ApplicantPriority priority,
        BigDecimal salary,

        @Size(max = 10)
        String salaryCurrency,

        LocalDate availability,
        String description,
        String interviewNotes
) {
}
