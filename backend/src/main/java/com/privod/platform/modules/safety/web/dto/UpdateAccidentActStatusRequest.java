package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.AccidentActStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAccidentActStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        AccidentActStatus status,

        String approvedByName,

        String notes
) {
}
