package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateChangeOrderRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Идентификатор договора обязателен")
        UUID contractId,

        @NotBlank(message = "Название ордера на изменение обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        ChangeOrderType changeOrderType,

        BigDecimal originalContractAmount,

        Integer scheduleImpactDays,

        UUID changeOrderRequestId
) {
}
