package com.privod.platform.modules.gpsTimesheet.web.dto;

import java.math.BigDecimal;

public record TimesheetDashboardResponse(
        long todayCheckedIn,
        long todayCheckedOut,
        long activeOnSite,
        BigDecimal avgHoursToday,
        long geofenceViolationsToday
) {
}
