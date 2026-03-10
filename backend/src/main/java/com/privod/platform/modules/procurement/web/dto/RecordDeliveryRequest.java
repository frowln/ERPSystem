package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;

public record RecordDeliveryRequest(
        LocalDate deliveryDate,

        @NotEmpty(message = "Список позиций доставки не может быть пустым")
        @Valid
        List<DeliveryItemRequest> items
) {
}
