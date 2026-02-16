package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.DependencyType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateWbsDependencyRequest(
        @NotNull(message = "ID предшественника обязателен")
        UUID predecessorId,

        @NotNull(message = "ID последователя обязателен")
        UUID successorId,

        DependencyType dependencyType,

        Integer lagDays
) {
}
