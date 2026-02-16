package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.OrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateEmploymentOrderRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotBlank(message = "Номер приказа обязателен")
        @Size(max = 50)
        String orderNumber,

        @NotNull(message = "Тип приказа обязателен")
        OrderType orderType,

        @NotNull(message = "Дата приказа обязательна")
        LocalDate orderDate,

        @NotNull(message = "Дата вступления в силу обязательна")
        LocalDate effectiveDate,

        String reason,

        @Size(max = 500)
        String basis,

        UUID signedById
) {
}
