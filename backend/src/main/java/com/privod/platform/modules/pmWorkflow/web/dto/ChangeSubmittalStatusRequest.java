package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangeSubmittalStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        SubmittalStatus status,

        UUID ballInCourt
) {
}
