package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeCommitmentStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        CommitmentStatus status
) {
}
