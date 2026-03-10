package com.privod.platform.modules.safety.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTrainingRecordRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        String employeeName,

        @NotBlank(message = "Тип обучения обязателен")
        String trainingType,

        @NotNull(message = "Дата прохождения обязательна")
        LocalDate completedDate,

        LocalDate expiryDate,

        String certificateNumber,

        String notes
) {
}
