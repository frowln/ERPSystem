package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.TrainingType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateSafetyTrainingRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        TrainingType trainingType,

        UUID projectId,

        LocalDate date,

        UUID instructorId,

        String instructorName,

        String participants,

        String topics,

        Integer duration,

        String notes
) {
}
