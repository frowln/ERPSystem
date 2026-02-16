package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.BusinessTrip;
import com.privod.platform.modules.hrRussian.domain.BusinessTripStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BusinessTripResponse(
        UUID id,
        UUID employeeId,
        String destination,
        String purpose,
        LocalDate startDate,
        LocalDate endDate,
        int daysCount,
        BigDecimal dailyAllowance,
        BigDecimal totalBudget,
        UUID orderId,
        BusinessTripStatus status,
        String statusDisplayName,
        LocalDate reportDate,
        String reportUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static BusinessTripResponse fromEntity(BusinessTrip t) {
        return new BusinessTripResponse(
                t.getId(),
                t.getEmployeeId(),
                t.getDestination(),
                t.getPurpose(),
                t.getStartDate(),
                t.getEndDate(),
                t.getDaysCount(),
                t.getDailyAllowance(),
                t.getTotalBudget(),
                t.getOrderId(),
                t.getStatus(),
                t.getStatus().getDisplayName(),
                t.getReportDate(),
                t.getReportUrl(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
