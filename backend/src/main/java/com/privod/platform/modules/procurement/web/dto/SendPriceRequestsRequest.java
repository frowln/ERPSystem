package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record SendPriceRequestsRequest(
        @NotEmpty(message = "Список материалов не должен быть пустым")
        List<UUID> materialIds,

        @NotNull(message = "Карта количеств обязательна")
        Map<String, String> quantities,

        @NotEmpty(message = "Список поставщиков не должен быть пустым")
        List<UUID> supplierIds,

        @NotNull(message = "Дедлайн обязателен")
        LocalDate deadline,

        @Size(max = 1000, message = "Адрес доставки не должен превышать 1000 символов")
        String deliveryAddress,

        @Size(max = 5000, message = "Комментарий не должен превышать 5000 символов")
        String message
) {
}
