package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.DispatchStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDispatchStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        DispatchStatus status
) {
}
