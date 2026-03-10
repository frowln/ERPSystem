package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.util.UUID;

/**
 * Published when a purchase order is created from an approved purchase request.
 * Listeners may use this to update procurement status, notify warehouse, create logistics tasks, etc.
 */
@Getter
public class PurchaseOrderCreatedEvent extends DomainEvent {

    private final UUID purchaseOrderId;
    private final UUID purchaseRequestId;
    private final UUID supplierId;

    public PurchaseOrderCreatedEvent(UUID purchaseOrderId, UUID purchaseRequestId, UUID supplierId) {
        this.purchaseOrderId = purchaseOrderId;
        this.purchaseRequestId = purchaseRequestId;
        this.supplierId = supplierId;
    }
}
