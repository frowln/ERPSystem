package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BodyPart;
import com.privod.platform.modules.safety.domain.InjuredPersonOutcome;
import com.privod.platform.modules.safety.domain.InjuryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateInjuredPersonRequest(
        UUID employeeId,

        @NotBlank(message = "ФИО пострадавшего обязательно")
        String fullName,

        String position,
        String department,
        LocalDate dateOfBirth,
        BigDecimal yearsOfExperience,

        @NotNull(message = "Тип травмы обязателен")
        InjuryType injuryType,

        @NotNull(message = "Часть тела обязательна")
        BodyPart bodyPart,

        String injuryDescription,
        boolean medicalTreatment,
        boolean hospitalized,
        String hospitalName,
        Integer workDaysLost,
        boolean returnedToWork,
        LocalDate returnDate,
        String disabilityType,
        InjuredPersonOutcome outcome
) {
}
