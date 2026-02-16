package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseRequestResponse(
        UUID id,
        String name,
        LocalDate requestDate,
        UUID projectId,
        UUID contractId,
        UUID specificationId,
        PurchaseRequestStatus status,
        String statusDisplayName,
        PurchaseRequestPriority priority,
        String priorityDisplayName,
        UUID requestedById,
        String requestedByName,
        UUID approvedById,
        UUID assignedToId,
        BigDecimal totalAmount,
        String rejectionReason,
        String notes,
        List<PurchaseRequestItemResponse> items,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PurchaseRequestResponse fromEntity(PurchaseRequest pr, List<PurchaseRequestItemResponse> items) {
        return new PurchaseRequestResponse(
                pr.getId(),
                pr.getName(),
                pr.getRequestDate(),
                pr.getProjectId(),
                pr.getContractId(),
                pr.getSpecificationId(),
                pr.getStatus(),
                pr.getStatus().getDisplayName(),
                pr.getPriority(),
                pr.getPriority().getDisplayName(),
                pr.getRequestedById(),
                pr.getRequestedByName(),
                pr.getApprovedById(),
                pr.getAssignedToId(),
                pr.getTotalAmount(),
                pr.getRejectionReason(),
                pr.getNotes(),
                items,
                pr.getCreatedAt(),
                pr.getUpdatedAt(),
                pr.getCreatedBy()
        );
    }
}
