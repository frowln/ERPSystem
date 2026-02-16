package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeRfiStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        RfiStatus status
) {
}
