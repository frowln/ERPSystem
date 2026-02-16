package com.privod.platform.modules.procurementExt.web.dto;

import com.privod.platform.modules.procurementExt.domain.DeliveryItem;

import java.math.BigDecimal;
import java.util.UUID;

public record DeliveryItemResponse(
        UUID id,
        UUID deliveryId,
        UUID materialId,
        BigDecimal quantity,
        String unit,
        BigDecimal weight
) {
    public static DeliveryItemResponse fromEntity(DeliveryItem di) {
        return new DeliveryItemResponse(
                di.getId(),
                di.getDeliveryId(),
                di.getMaterialId(),
                di.getQuantity(),
                di.getUnit(),
                di.getWeight()
        );
    }
}
