package com.privod.platform.modules.leave.web.dto;

import com.privod.platform.modules.leave.domain.LeaveRequest;
import com.privod.platform.modules.leave.domain.LeaveRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record LeaveRequestResponse(
        UUID id,
        UUID employeeId,
        UUID leaveTypeId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal numberOfDays,
        String reason,
        LeaveRequestStatus status,
        String statusDisplayName,
        UUID approverId,
        LocalDateTime approvedAt,
        String refusalReason,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LeaveRequestResponse fromEntity(LeaveRequest lr) {
        return new LeaveRequestResponse(
                lr.getId(),
                lr.getEmployeeId(),
                lr.getLeaveTypeId(),
                lr.getStartDate(),
                lr.getEndDate(),
                lr.getNumberOfDays(),
                lr.getReason(),
                lr.getStatus(),
                lr.getStatus().getDisplayName(),
                lr.getApproverId(),
                lr.getApprovedAt(),
                lr.getRefusalReason(),
                lr.getCreatedAt(),
                lr.getUpdatedAt(),
                lr.getCreatedBy()
        );
    }
}
