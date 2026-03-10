package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.PpeCondition;
import com.privod.platform.modules.safety.domain.PpeIssue;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PpeIssueResponse(
        UUID id,
        UUID itemId,
        String itemName,
        UUID employeeId,
        String employeeName,
        Integer quantity,
        LocalDate issuedDate,
        LocalDate returnDate,
        PpeCondition returnCondition,
        String returnConditionDisplayName,
        boolean returned,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static PpeIssueResponse fromEntity(PpeIssue entity) {
        return new PpeIssueResponse(
                entity.getId(),
                entity.getItemId(),
                entity.getItemName(),
                entity.getEmployeeId(),
                entity.getEmployeeName(),
                entity.getQuantity(),
                entity.getIssuedDate(),
                entity.getReturnDate(),
                entity.getReturnCondition(),
                entity.getReturnCondition() != null ? entity.getReturnCondition().getDisplayName() : null,
                entity.isReturned(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
