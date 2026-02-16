package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.DistributionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateMonteCarloTaskRequest(
        @NotBlank(message = "Наименование задачи обязательно")
        @Size(max = 500, message = "Наименование задачи не должно превышать 500 символов")
        String taskName,

        UUID wbsNodeId,

        @Min(value = 1, message = "Оптимистичная длительность должна быть не менее 1 дня")
        int optimisticDuration,

        @Min(value = 1, message = "Наиболее вероятная длительность должна быть не менее 1 дня")
        int mostLikelyDuration,

        @Min(value = 1, message = "Пессимистичная длительность должна быть не менее 1 дня")
        int pessimisticDuration,

        DistributionType distribution,

        String dependencies
) {
}
