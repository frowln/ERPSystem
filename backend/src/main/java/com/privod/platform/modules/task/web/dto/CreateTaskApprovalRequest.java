package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTaskApprovalRequest(
        @NotNull(message = "ID утверждающего обязательно")
        UUID approverId,

        @Size(max = 255)
        String approverName,

        Integer sequence
) {
}
