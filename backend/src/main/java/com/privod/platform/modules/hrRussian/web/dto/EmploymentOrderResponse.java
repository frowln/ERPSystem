package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.EmploymentOrder;
import com.privod.platform.modules.hrRussian.domain.OrderType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmploymentOrderResponse(
        UUID id,
        UUID employeeId,
        String orderNumber,
        OrderType orderType,
        String orderTypeDisplayName,
        LocalDate orderDate,
        LocalDate effectiveDate,
        String reason,
        String basis,
        UUID signedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static EmploymentOrderResponse fromEntity(EmploymentOrder o) {
        return new EmploymentOrderResponse(
                o.getId(),
                o.getEmployeeId(),
                o.getOrderNumber(),
                o.getOrderType(),
                o.getOrderType().getDisplayName(),
                o.getOrderDate(),
                o.getEffectiveDate(),
                o.getReason(),
                o.getBasis(),
                o.getSignedById(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
