package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * A maintenance item that is due or approaching due based on schedule rules.
 */
public record MaintenanceDueItem(
        UUID vehicleId,
        String vehicleCode,
        String vehicleName,
        UUID ruleId,
        String ruleName,
        String maintenanceType,
        String triggerReason,
        BigDecimal currentHours,
        BigDecimal thresholdHours,
        BigDecimal currentMileage,
        BigDecimal thresholdMileage,
        LocalDate dueDate,
        boolean overdue
) {
}
