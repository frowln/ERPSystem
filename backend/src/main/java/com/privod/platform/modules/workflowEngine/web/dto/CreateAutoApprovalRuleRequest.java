package com.privod.platform.modules.workflowEngine.web.dto;

import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateAutoApprovalRuleRequest(
        @NotBlank(message = "Наименование правила обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        @NotNull(message = "Тип сущности обязателен")
        ApprovalEntityType entityType,

        String conditions,

        BigDecimal autoApproveThreshold,

        @Min(value = 1, message = "Минимальное количество согласующих — 1")
        Integer requiredApprovers,

        @Min(value = 1, message = "Минимальный таймаут эскалации — 1 час")
        Integer escalationTimeoutHours,

        Boolean isActive,
        UUID projectId,
        UUID organizationId
) {
}
