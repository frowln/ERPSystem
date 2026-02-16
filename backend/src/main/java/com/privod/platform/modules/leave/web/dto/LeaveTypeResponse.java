package com.privod.platform.modules.leave.web.dto;

import com.privod.platform.modules.leave.domain.LeaveType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LeaveTypeResponse(
        UUID id,
        String name,
        String code,
        String color,
        BigDecimal maxDays,
        boolean requiresApproval,
        boolean allowNegative,
        boolean isActive,
        LocalDate validityStart,
        LocalDate validityEnd,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LeaveTypeResponse fromEntity(LeaveType lt) {
        return new LeaveTypeResponse(
                lt.getId(),
                lt.getName(),
                lt.getCode(),
                lt.getColor(),
                lt.getMaxDays(),
                lt.isRequiresApproval(),
                lt.isAllowNegative(),
                lt.isActive(),
                lt.getValidityStart(),
                lt.getValidityEnd(),
                lt.getCreatedAt(),
                lt.getUpdatedAt(),
                lt.getCreatedBy()
        );
    }
}
