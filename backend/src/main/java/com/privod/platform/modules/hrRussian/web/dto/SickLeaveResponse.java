package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.SickLeave;
import com.privod.platform.modules.hrRussian.domain.SickLeaveStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SickLeaveResponse(
        UUID id,
        UUID employeeId,
        LocalDate startDate,
        LocalDate endDate,
        int daysCount,
        String sickLeaveNumber,
        String diagnosis,
        boolean extension,
        UUID previousSickLeaveId,
        BigDecimal paymentAmount,
        SickLeaveStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static SickLeaveResponse fromEntity(SickLeave s) {
        return new SickLeaveResponse(
                s.getId(),
                s.getEmployeeId(),
                s.getStartDate(),
                s.getEndDate(),
                s.getDaysCount(),
                s.getSickLeaveNumber(),
                s.getDiagnosis(),
                s.isExtension(),
                s.getPreviousSickLeaveId(),
                s.getPaymentAmount(),
                s.getStatus(),
                s.getStatus().getDisplayName(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
