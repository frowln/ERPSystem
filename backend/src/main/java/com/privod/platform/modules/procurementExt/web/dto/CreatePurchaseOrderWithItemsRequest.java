package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreatePurchaseOrderWithItemsRequest(
        @NotBlank(message = "Номер заказа обязателен")
        @Size(max = 50, message = "Номер заказа не должен превышать 50 символов")
        String orderNumber,

        UUID projectId,
        UUID purchaseRequestId,
        UUID contractId,

        @NotNull(message = "Поставщик обязателен")
        UUID supplierId,

        LocalDate orderDate,
        LocalDate expectedDeliveryDate,

        @Size(max = 3, message = "Валюта не должна превышать 3 символа")
        String currency,

        @Size(max = 500, message = "Условия оплаты не должны превышать 500 символов")
        String paymentTerms,

        @Size(max = 1000, message = "Адрес поставки не должен превышать 1000 символов")
        String deliveryAddress,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes,

        @NotEmpty(message = "Добавьте хотя бы одну позицию")
        List<@Valid CreatePurchaseOrderItemRequest> items
) {
}
