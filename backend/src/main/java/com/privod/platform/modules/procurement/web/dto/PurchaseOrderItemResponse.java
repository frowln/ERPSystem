package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseOrderItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PurchaseOrderItemResponse(
        UUID id,
        UUID purchaseOrderId,
        UUID materialId,
        String materialName,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal vatRate,
        BigDecimal totalAmount,
        BigDecimal deliveredQuantity,
        UUID specificationItemId,
        Instant createdAt,
        Instant updatedAt
) {
    public static PurchaseOrderItemResponse fromEntity(PurchaseOrderItem item) {
        return new PurchaseOrderItemResponse(
                item.getId(),
                item.getPurchaseOrderId(),
                item.getMaterialId(),
                item.getMaterialName(),
                item.getUnit(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getVatRate(),
                item.getTotalAmount(),
                item.getDeliveredQuantity(),
                item.getSpecificationItemId(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
