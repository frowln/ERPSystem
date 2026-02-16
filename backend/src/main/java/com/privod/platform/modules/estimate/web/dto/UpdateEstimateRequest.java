package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateEstimateRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        UUID contractId,

        String notes
) {
}
