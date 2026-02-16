package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEmployeeRequest(
        UUID userId,

        @NotBlank(message = "Имя обязательно")
        @Size(max = 255, message = "Имя не должно превышать 255 символов")
        String firstName,

        @NotBlank(message = "Фамилия обязательна")
        @Size(max = 255, message = "Фамилия не должна превышать 255 символов")
        String lastName,

        @Size(max = 255)
        String middleName,

        @Size(max = 200)
        String position,

        UUID departmentId,

        UUID organizationId,

        @NotNull(message = "Дата приёма обязательна")
        LocalDate hireDate,

        String phone,
        String email,

        @Size(max = 20)
        String passportNumber,

        @Size(max = 12)
        String inn,

        @Size(max = 14)
        String snils,

        BigDecimal hourlyRate,
        BigDecimal monthlyRate,
        String notes
) {
}
