package com.privod.platform.modules.fleet.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateFleetWaybillRequest(
        UUID vehicleId,
        UUID projectId,
        LocalDate waybillDate,
        UUID driverId,
        String driverName,
        String routeDescription,
        String departurePoint,
        String destinationPoint,
        Instant departureTime,
        Instant returnTime,
        BigDecimal mileageStart,
        BigDecimal mileageEnd,
        BigDecimal engineHoursStart,
        BigDecimal engineHoursEnd,
        BigDecimal fuelDispensed,
        BigDecimal fuelConsumed,
        BigDecimal fuelRemaining,
        Boolean medicalExamPassed,
        Instant medicalExamTime,
        String medicalExaminer,
        Boolean mechanicApproved,
        String mechanicName,
        Instant mechanicCheckTime,
        String notes
) {}
