package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdatePurchaseOrderRequest(
        UUID supplierId,

        UUID projectId,

        UUID contractId,

        LocalDate orderDate,

        LocalDate expectedDeliveryDate,

        @Size(max = 500, message = "Условия оплаты не должны превышать 500 символов")
        String paymentTerms,

        @Size(max = 1000, message = "Адрес доставки не должен превышать 1000 символов")
        String deliveryAddress,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
