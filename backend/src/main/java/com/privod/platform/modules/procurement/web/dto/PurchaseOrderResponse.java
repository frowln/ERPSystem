package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseOrder;
import com.privod.platform.modules.procurement.domain.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        String orderNumber,
        UUID projectId,
        UUID purchaseRequestId,
        UUID contractId,
        UUID supplierId,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        LocalDate actualDeliveryDate,
        BigDecimal subtotal,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        String currency,
        PurchaseOrderStatus status,
        String statusDisplayName,
        String paymentTerms,
        String deliveryAddress,
        String notes,
        List<PurchaseOrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PurchaseOrderResponse fromEntity(PurchaseOrder po, List<PurchaseOrderItemResponse> items) {
        return new PurchaseOrderResponse(
                po.getId(),
                po.getOrderNumber(),
                po.getProjectId(),
                po.getPurchaseRequestId(),
                po.getContractId(),
                po.getSupplierId(),
                po.getOrderDate(),
                po.getExpectedDeliveryDate(),
                po.getActualDeliveryDate(),
                po.getSubtotal(),
                po.getVatAmount(),
                po.getTotalAmount(),
                po.getCurrency(),
                po.getStatus(),
                po.getStatus().getDisplayName(),
                po.getPaymentTerms(),
                po.getDeliveryAddress(),
                po.getNotes(),
                items,
                po.getCreatedAt(),
                po.getUpdatedAt(),
                po.getCreatedBy()
        );
    }
}
