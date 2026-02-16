package com.privod.platform.modules.procurementExt.web.dto;

import com.privod.platform.modules.procurementExt.domain.DispatchItem;

import java.math.BigDecimal;
import java.util.UUID;

public record DispatchItemResponse(
        UUID id,
        UUID orderId,
        UUID materialId,
        BigDecimal quantity,
        UUID fromWarehouseId,
        UUID toWarehouseId
) {
    public static DispatchItemResponse fromEntity(DispatchItem di) {
        return new DispatchItemResponse(
                di.getId(),
                di.getOrderId(),
                di.getMaterialId(),
                di.getQuantity(),
                di.getFromWarehouseId(),
                di.getToWarehouseId()
        );
    }
}
