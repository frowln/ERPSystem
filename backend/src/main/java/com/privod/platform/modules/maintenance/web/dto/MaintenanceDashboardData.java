package com.privod.platform.modules.maintenance.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record MaintenanceDashboardData(
        long openRequests,
        long totalRequests,
        Map<String, Long> requestsByStatus,
        Double avgResolutionDays,
        long totalEquipment,
        long operationalEquipment,
        BigDecimal equipmentUtilizationPercent,
        Map<String, Long> equipmentByStatus,
        List<MaintenanceRequestResponse> overdueRequests,
        List<PreventiveScheduleResponse> upcomingPreventive
) {
}
