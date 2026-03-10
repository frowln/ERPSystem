package com.privod.platform.modules.safety.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateAccidentActRequest(
        UUID projectId,

        UUID incidentId,

        @NotNull(message = "Дата несчастного случая обязательна")
        LocalDateTime accidentDate,

        String accidentLocation,

        @NotBlank(message = "ФИО пострадавшего обязательно")
        String victimFullName,

        String victimPosition,
        LocalDate victimBirthDate,
        String victimGender,
        String victimWorkExperience,
        LocalDate victimBriefingDate,
        String victimBriefingType,

        String commissionChairman,
        String commissionMembers,

        String circumstances,
        String rootCauses,
        String correctiveMeasures,
        String responsiblePersons,

        String injuryDescription,
        String injurySeverity,
        Integer workDaysLost,
        boolean hospitalization,
        boolean fatal,

        String notes
) {
}
