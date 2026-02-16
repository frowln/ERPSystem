package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePaymentOrderRequest(
        @NotNull(message = "Идентификатор точки интеграции обязателен")
        UUID endpointId,

        @NotBlank(message = "Номер счёта получателя обязателен")
        @Size(max = 20, message = "Номер счёта не должен превышать 20 символов")
        String recipientAccount,

        @NotBlank(message = "БИК получателя обязателен")
        @Size(max = 9, message = "БИК не должен превышать 9 символов")
        String recipientBik,

        @NotBlank(message = "ИНН получателя обязателен")
        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String recipientInn,

        @NotBlank(message = "Наименование получателя обязательно")
        @Size(max = 500, message = "Наименование получателя не должно превышать 500 символов")
        String recipientName,

        @NotNull(message = "Сумма платежа обязательна")
        @Positive(message = "Сумма платежа должна быть положительной")
        BigDecimal amount,

        @NotBlank(message = "Назначение платежа обязательно")
        @Size(max = 210, message = "Назначение платежа не должно превышать 210 символов")
        String purpose,

        UUID linkedEntityId,
        String linkedEntityType
) {
}
