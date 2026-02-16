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
        String projectName,
        PurchaseRequestStatus status,
        String statusDisplayName,
        PurchaseRequestPriority priority,
        String priorityDisplayName,
        UUID requestedById,
        String requestedByName,
        UUID assignedToId,
        String assignedToName,
        Long itemCount,
        BigDecimal totalAmount
) {
    public static PurchaseRequestListResponse fromEntity(PurchaseRequest pr) {
        return fromEntity(pr, null, null, null);
    }

    public static PurchaseRequestListResponse fromEntity(
            PurchaseRequest pr,
            String projectName,
            String assignedToName,
            Long itemCount
    ) {
        return new PurchaseRequestListResponse(
                pr.getId(),
                pr.getName(),
                pr.getRequestDate(),
                pr.getProjectId(),
                projectName,
                pr.getStatus(),
                pr.getStatus().getDisplayName(),
                pr.getPriority(),
                pr.getPriority().getDisplayName(),
                pr.getRequestedById(),
                pr.getRequestedByName(),
                pr.getAssignedToId(),
                assignedToName,
                itemCount != null ? itemCount : 0L,
                pr.getTotalAmount()
        );
    }
}
