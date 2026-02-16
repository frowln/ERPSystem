package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.EstimateStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeEstimateStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        EstimateStatus status
) {
}
