package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.FleetWaybill;
import com.privod.platform.modules.fleet.domain.WaybillStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FleetWaybillResponse(
        UUID id,
        UUID organizationId,
        UUID vehicleId,
        String vehicleName,
        String vehicleLicensePlate,
        UUID projectId,
        String projectName,
        String number,
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
        BigDecimal distance,
        BigDecimal engineHoursStart,
        BigDecimal engineHoursEnd,
        BigDecimal engineHoursWorked,
        BigDecimal fuelDispensed,
        BigDecimal fuelConsumed,
        BigDecimal fuelNorm,
        BigDecimal fuelRemaining,
        BigDecimal fuelVariancePercent,
        Boolean medicalExamPassed,
        Instant medicalExamTime,
        String medicalExaminer,
        Boolean mechanicApproved,
        String mechanicName,
        Instant mechanicCheckTime,
        WaybillStatus status,
        String statusDisplayName,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static FleetWaybillResponse fromEntity(FleetWaybill w, String vehicleName, String vehicleLicensePlate, String projectName) {
        return new FleetWaybillResponse(
                w.getId(),
                w.getOrganizationId(),
                w.getVehicleId(),
                vehicleName,
                vehicleLicensePlate,
                w.getProjectId(),
                projectName,
                w.getNumber(),
                w.getWaybillDate(),
                w.getDriverId(),
                w.getDriverName(),
                w.getRouteDescription(),
                w.getDeparturePoint(),
                w.getDestinationPoint(),
                w.getDepartureTime(),
                w.getReturnTime(),
                w.getMileageStart(),
                w.getMileageEnd(),
                w.getDistance(),
                w.getEngineHoursStart(),
                w.getEngineHoursEnd(),
                w.getEngineHoursWorked(),
                w.getFuelDispensed(),
                w.getFuelConsumed(),
                w.getFuelNorm(),
                w.getFuelRemaining(),
                w.getFuelVariancePercent(),
                w.getMedicalExamPassed(),
                w.getMedicalExamTime(),
                w.getMedicalExaminer(),
                w.getMechanicApproved(),
                w.getMechanicName(),
                w.getMechanicCheckTime(),
                w.getStatus(),
                w.getStatus().getDisplayName(),
                w.getNotes(),
                w.getCreatedAt(),
                w.getUpdatedAt()
        );
    }
}
