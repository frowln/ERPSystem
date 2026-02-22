package com.privod.platform.modules.gpsTimesheet.web.dto;

import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetSummary;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GpsTimesheetSummaryResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        int periodYear,
        int periodMonth,
        int totalDays,
        BigDecimal totalHours,
        BigDecimal verifiedHours,
        int geofenceViolations,
        Instant createdAt,
        Instant updatedAt
) {
    public static GpsTimesheetSummaryResponse fromEntity(GpsTimesheetSummary entity) {
        return new GpsTimesheetSummaryResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getEmployeeId(),
                entity.getPeriodYear(),
                entity.getPeriodMonth(),
                entity.getTotalDays(),
                entity.getTotalHours(),
                entity.getVerifiedHours(),
                entity.getGeofenceViolations(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
