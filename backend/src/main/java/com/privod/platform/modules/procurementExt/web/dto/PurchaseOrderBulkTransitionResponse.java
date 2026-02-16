package com.privod.platform.modules.procurementExt.web.dto;

import java.util.List;
import java.util.UUID;

public record PurchaseOrderBulkTransitionResponse(
        PurchaseOrderBulkTransitionAction action,
        int requestedCount,
        int successCount,
        int failedCount,
        List<UUID> succeededOrderIds,
        List<ItemError> errors
) {
    public record ItemError(
            UUID orderId,
            String message
    ) {
    }
}
