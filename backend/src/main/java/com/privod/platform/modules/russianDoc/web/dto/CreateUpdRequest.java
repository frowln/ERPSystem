package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateUpdRequest(
        @NotBlank(message = "Номер УПД обязателен")
        @Size(max = 100)
        String number,

        @NotNull(message = "Дата УПД обязательна")
        LocalDate date,

        @NotNull(message = "Продавец обязателен")
        UUID sellerId,

        @NotNull(message = "Покупатель обязателен")
        UUID buyerId,

        String items,

        BigDecimal totalAmount,

        BigDecimal vatAmount,

        UUID organizationId,

        UUID projectId
) {
}
