package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.DistributionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateMonteCarloTaskRequest(
        @Size(max = 500, message = "Наименование задачи не должно превышать 500 символов")
        String taskName,

        UUID wbsNodeId,

        @Min(value = 1, message = "Оптимистичная длительность должна быть не менее 1 дня")
        Integer optimisticDuration,

        @Min(value = 1, message = "Наиболее вероятная длительность должна быть не менее 1 дня")
        Integer mostLikelyDuration,

        @Min(value = 1, message = "Пессимистичная длительность должна быть не менее 1 дня")
        Integer pessimisticDuration,

        DistributionType distribution,

        String dependencies
) {
}
