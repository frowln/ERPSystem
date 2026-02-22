package com.privod.platform.modules.fleet.web.dto;

import java.util.List;

public record ComplianceDashboardResponse(
        int totalVehicles,
        int overdueMaintenanceCount,
        int approachingMaintenanceCount,
        int expiredInsuranceCount,
        int expiringInsuranceCount,
        int expiredTechInspectionCount,
        int expiringTechInspectionCount,
        List<MaintenanceDueItem> dueItems,
        List<VehicleComplianceItem> insuranceAlerts,
        List<VehicleComplianceItem> techInspectionAlerts
) {
    public record VehicleComplianceItem(
            String vehicleId,
            String vehicleCode,
            String vehicleName,
            String expiryDate,
            int daysRemaining,
            boolean expired
    ) {
    }
}
