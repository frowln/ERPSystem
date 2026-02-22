package com.privod.platform.modules.iot.web.dto;

public record IotDashboardResponse(
        long totalDevices,
        long activeDevices,
        long totalAlerts,
        long unacknowledgedAlerts,
        Double avgFuelLevel,
        Double totalEngineHours
) {
}
