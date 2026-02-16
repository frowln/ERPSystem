package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.TrainingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSafetyTrainingRequest(
        @NotBlank(message = "Название инструктажа обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @NotNull(message = "Тип инструктажа обязателен")
        TrainingType trainingType,

        UUID projectId,

        @NotNull(message = "Дата обязательна")
        LocalDate date,

        UUID instructorId,

        String instructorName,

        String participants,

        String topics,

        Integer duration,

        String notes
) {
}
