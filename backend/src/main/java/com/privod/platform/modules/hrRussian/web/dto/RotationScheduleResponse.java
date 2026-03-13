package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.RotationSchedule;
import com.privod.platform.modules.hrRussian.domain.RotationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RotationScheduleResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        UUID projectId,
        LocalDate shiftStart,
        LocalDate shiftEnd,
        Integer workDays,
        Integer restDays,
        Double shiftBonusPercent,
        RotationStatus status,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static RotationScheduleResponse fromEntity(RotationSchedule s) {
        return new RotationScheduleResponse(
                s.getId(),
                s.getOrganizationId(),
                s.getEmployeeId(),
                s.getProjectId(),
                s.getShiftStart(),
                s.getShiftEnd(),
                s.getWorkDays(),
                s.getRestDays(),
                s.getShiftBonusPercent(),
                s.getStatus(),
                s.getNotes(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
