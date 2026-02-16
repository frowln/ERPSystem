package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record ProcessApprovalRequest(
        @NotNull(message = "Статус утверждения обязателен")
        ApprovalStatus status,

        String comment
) {
}
