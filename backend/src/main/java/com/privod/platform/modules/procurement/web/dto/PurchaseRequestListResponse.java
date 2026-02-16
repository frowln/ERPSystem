package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PurchaseRequestListResponse(
        UUID id,
        String name,
        LocalDate requestDate,
        UUID projectId,
        PurchaseRequestStatus status,
        String statusDisplayName,
        PurchaseRequestPriority priority,
        String priorityDisplayName,
        String requestedByName,
        UUID assignedToId,
        BigDecimal totalAmount
) {
    public static PurchaseRequestListResponse fromEntity(PurchaseRequest pr) {
        return new PurchaseRequestListResponse(
                pr.getId(),
                pr.getName(),
                pr.getRequestDate(),
                pr.getProjectId(),
                pr.getStatus(),
                pr.getStatus().getDisplayName(),
                pr.getPriority(),
                pr.getPriority().getDisplayName(),
                pr.getRequestedByName(),
                pr.getAssignedToId(),
                pr.getTotalAmount()
        );
    }
}
