package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.CrewAssignment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CrewAssignmentResponse(
        UUID id,
        UUID employeeId,
        UUID projectId,
        String role,
        LocalDate startDate,
        LocalDate endDate,
        boolean active,
        BigDecimal hourlyRate,
        Instant createdAt,
        Instant updatedAt
) {
    public static CrewAssignmentResponse fromEntity(CrewAssignment assignment) {
        return new CrewAssignmentResponse(
                assignment.getId(),
                assignment.getEmployeeId(),
                assignment.getProjectId(),
                assignment.getRole(),
                assignment.getStartDate(),
                assignment.getEndDate(),
                assignment.isActive(),
                assignment.getHourlyRate(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }
}
