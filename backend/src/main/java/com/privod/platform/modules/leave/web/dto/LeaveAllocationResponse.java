package com.privod.platform.modules.leave.web.dto;

import com.privod.platform.modules.leave.domain.LeaveAllocation;
import com.privod.platform.modules.leave.domain.LeaveAllocationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LeaveAllocationResponse(
        UUID id,
        UUID employeeId,
        UUID leaveTypeId,
        BigDecimal allocatedDays,
        BigDecimal usedDays,
        BigDecimal remainingDays,
        int year,
        String notes,
        LeaveAllocationStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LeaveAllocationResponse fromEntity(LeaveAllocation la) {
        return new LeaveAllocationResponse(
                la.getId(),
                la.getEmployeeId(),
                la.getLeaveTypeId(),
                la.getAllocatedDays(),
                la.getUsedDays(),
                la.getRemainingDays(),
                la.getYear(),
                la.getNotes(),
                la.getStatus(),
                la.getStatus().getDisplayName(),
                la.getCreatedAt(),
                la.getUpdatedAt(),
                la.getCreatedBy()
        );
    }
}
