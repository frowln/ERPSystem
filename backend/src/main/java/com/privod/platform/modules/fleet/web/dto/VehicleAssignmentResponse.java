package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.AssignmentStatus;
import com.privod.platform.modules.fleet.domain.VehicleAssignment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record VehicleAssignmentResponse(
        UUID id,
        UUID vehicleId,
        UUID projectId,
        UUID assignedById,
        UUID operatorId,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate actualReturnDate,
        AssignmentStatus status,
        String statusDisplayName,
        BigDecimal dailyRate,
        BigDecimal totalCost,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static VehicleAssignmentResponse fromEntity(VehicleAssignment assignment) {
        return new VehicleAssignmentResponse(
                assignment.getId(),
                assignment.getVehicleId(),
                assignment.getProjectId(),
                assignment.getAssignedById(),
                assignment.getOperatorId(),
                assignment.getStartDate(),
                assignment.getEndDate(),
                assignment.getActualReturnDate(),
                assignment.getStatus(),
                assignment.getStatus().getDisplayName(),
                assignment.getDailyRate(),
                assignment.getTotalCost(),
                assignment.getNotes(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt(),
                assignment.getCreatedBy()
        );
    }
}
