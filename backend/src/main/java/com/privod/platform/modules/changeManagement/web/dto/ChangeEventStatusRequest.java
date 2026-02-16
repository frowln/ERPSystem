package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeEventStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        ChangeEventStatus status
) {
}
