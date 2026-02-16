package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record PurchaseOrderBulkTransitionRequest(
        @NotNull(message = "Действие обязательно")
        PurchaseOrderBulkTransitionAction action,

        @NotEmpty(message = "Выберите хотя бы один заказ")
        @Size(max = 200, message = "За один запрос можно обработать не более 200 заказов")
        List<@NotNull(message = "ID заказа обязателен") UUID> orderIds
) {
}
