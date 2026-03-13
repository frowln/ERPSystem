package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.domain.VacationStatus;
import com.privod.platform.modules.hrRussian.domain.VacationType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record VacationResponse(
        UUID id,
        UUID employeeId,
        VacationType vacationType,
        String vacationTypeDisplayName,
        LocalDate startDate,
        LocalDate endDate,
        int daysCount,
        VacationStatus status,
        String statusDisplayName,
        UUID orderId,
        UUID substitutingEmployeeId,
        BigDecimal annualEarnings,        // заработок за 12 мес (основа расчёта)
        BigDecimal averageDailyEarnings,  // средний дневной заработок (ст.139 ТК РФ)
        BigDecimal vacationPay,           // отпускные = averageDailyEarnings × daysCount
        Instant createdAt,
        Instant updatedAt
) {
    public static VacationResponse fromEntity(Vacation v) {
        return new VacationResponse(
                v.getId(),
                v.getEmployeeId(),
                v.getVacationType(),
                v.getVacationType().getDisplayName(),
                v.getStartDate(),
                v.getEndDate(),
                v.getDaysCount(),
                v.getStatus(),
                v.getStatus().getDisplayName(),
                v.getOrderId(),
                v.getSubstitutingEmployeeId(),
                v.getAnnualEarnings(),
                v.getAverageDailyEarnings(),
                v.getVacationPay(),
                v.getCreatedAt(),
                v.getUpdatedAt()
        );
    }
}
