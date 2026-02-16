package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import jakarta.validation.constraints.NotNull;

public record ChangeLifecycleStateRequest(
        @NotNull(message = "Новое состояние жизненного цикла обязательно")
        DocumentLifecycleState newState
) {
}
