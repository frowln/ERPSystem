package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CommitmentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCommitmentRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Наименование обязательства обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String title,

        @NotNull(message = "Тип обязательства обязателен")
        CommitmentType commitmentType,

        UUID vendorId,

        UUID contractId,

        @NotNull(message = "Сумма обязательства обязательна")
        @DecimalMin(value = "0", message = "Сумма обязательства не может быть отрицательной")
        BigDecimal originalAmount,

        @DecimalMin(value = "0", message = "Процент удержания не может быть отрицательным")
        BigDecimal retentionPercent,

        LocalDate startDate,

        LocalDate endDate,

        UUID costCodeId
) {
}
