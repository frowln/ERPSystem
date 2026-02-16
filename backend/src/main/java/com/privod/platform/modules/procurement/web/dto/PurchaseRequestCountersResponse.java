package com.privod.platform.modules.procurement.web.dto;

public record PurchaseRequestCountersResponse(
        long all,
        long my,
        long inApproval,
        long inWork,
        long delivered
) {
}
