package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangeIssueStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        IssueStatus status,

        UUID resolvedById
) {
}
