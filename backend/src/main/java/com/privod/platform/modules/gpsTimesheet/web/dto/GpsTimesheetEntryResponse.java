package com.privod.platform.modules.gpsTimesheet.web.dto;

import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record GpsTimesheetEntryResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        UUID projectId,
        UUID checkInEventId,
        UUID checkOutEventId,
        LocalDate workDate,
        Instant checkInTime,
        Instant checkOutTime,
        BigDecimal totalHours,
        boolean isVerified,
        boolean isGeofenceVerified,
        UUID costCodeId,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static GpsTimesheetEntryResponse fromEntity(GpsTimesheetEntry entity) {
        return new GpsTimesheetEntryResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getEmployeeId(),
                entity.getProjectId(),
                entity.getCheckInEventId(),
                entity.getCheckOutEventId(),
                entity.getWorkDate(),
                entity.getCheckInTime(),
                entity.getCheckOutTime(),
                entity.getTotalHours(),
                entity.isVerified(),
                entity.isGeofenceVerified(),
                entity.getCostCodeId(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
