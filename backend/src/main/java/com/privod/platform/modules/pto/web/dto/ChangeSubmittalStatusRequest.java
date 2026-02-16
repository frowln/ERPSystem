package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeSubmittalStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        SubmittalStatus status
) {
}
