package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.fleet.domain.FleetWaybill;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.WaybillStatus;
import com.privod.platform.modules.fleet.repository.FleetWaybillRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateFleetWaybillRequest;
import com.privod.platform.modules.fleet.web.dto.FleetWaybillResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateFleetWaybillRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FleetWaybillService {

    private final FleetWaybillRepository waybillRepository;
    private final VehicleRepository vehicleRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public Page<FleetWaybillResponse> listWaybills(UUID vehicleId, WaybillStatus status, String search, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return waybillRepository.findAllFiltered(orgId, vehicleId, status, search, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public FleetWaybillResponse getWaybill(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        FleetWaybill w = waybillRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден"));
        if (!orgId.equals(w.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден");
        }
        return toResponse(w);
    }

    @Transactional
    public FleetWaybillResponse createWaybill(CreateFleetWaybillRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Транспортное средство не найдено"));

        long seq = waybillRepository.getNextNumberSequence();
        String number = String.format("ПЛ-%05d", seq);

        FleetWaybill w = FleetWaybill.builder()
                .organizationId(orgId)
                .vehicleId(request.vehicleId())
                .projectId(request.projectId())
                .number(number)
                .waybillDate(request.waybillDate())
                .driverId(request.driverId())
                .driverName(request.driverName())
                .routeDescription(request.routeDescription())
                .departurePoint(request.departurePoint())
                .destinationPoint(request.destinationPoint())
                .departureTime(request.departureTime())
                .returnTime(request.returnTime())
                .mileageStart(request.mileageStart())
                .mileageEnd(request.mileageEnd())
                .engineHoursStart(request.engineHoursStart())
                .engineHoursEnd(request.engineHoursEnd())
                .fuelDispensed(request.fuelDispensed())
                .fuelConsumed(request.fuelConsumed())
                .fuelRemaining(request.fuelRemaining())
                .medicalExamPassed(request.medicalExamPassed() != null ? request.medicalExamPassed() : false)
                .medicalExamTime(request.medicalExamTime())
                .medicalExaminer(request.medicalExaminer())
                .mechanicApproved(request.mechanicApproved() != null ? request.mechanicApproved() : false)
                .mechanicName(request.mechanicName())
                .mechanicCheckTime(request.mechanicCheckTime())
                .notes(request.notes())
                .build();

        // Auto-calculate fuel norm based on vehicle consumption rate
        calculateFuelNorm(w, vehicle);

        w = waybillRepository.save(w);
        log.info("Fleet waybill created: {} for vehicle {}", w.getNumber(), request.vehicleId());
        return toResponse(w);
    }

    @Transactional
    public FleetWaybillResponse updateWaybill(UUID id, UpdateFleetWaybillRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        FleetWaybill w = waybillRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден"));
        if (!orgId.equals(w.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден");
        }

        if (request.vehicleId() != null) w.setVehicleId(request.vehicleId());
        if (request.projectId() != null) w.setProjectId(request.projectId());
        if (request.waybillDate() != null) w.setWaybillDate(request.waybillDate());
        if (request.driverId() != null) w.setDriverId(request.driverId());
        if (request.driverName() != null) w.setDriverName(request.driverName());
        if (request.routeDescription() != null) w.setRouteDescription(request.routeDescription());
        if (request.departurePoint() != null) w.setDeparturePoint(request.departurePoint());
        if (request.destinationPoint() != null) w.setDestinationPoint(request.destinationPoint());
        if (request.departureTime() != null) w.setDepartureTime(request.departureTime());
        if (request.returnTime() != null) w.setReturnTime(request.returnTime());
        if (request.mileageStart() != null) w.setMileageStart(request.mileageStart());
        if (request.mileageEnd() != null) w.setMileageEnd(request.mileageEnd());
        if (request.engineHoursStart() != null) w.setEngineHoursStart(request.engineHoursStart());
        if (request.engineHoursEnd() != null) w.setEngineHoursEnd(request.engineHoursEnd());
        if (request.fuelDispensed() != null) w.setFuelDispensed(request.fuelDispensed());
        if (request.fuelConsumed() != null) w.setFuelConsumed(request.fuelConsumed());
        if (request.fuelRemaining() != null) w.setFuelRemaining(request.fuelRemaining());
        if (request.medicalExamPassed() != null) w.setMedicalExamPassed(request.medicalExamPassed());
        if (request.medicalExamTime() != null) w.setMedicalExamTime(request.medicalExamTime());
        if (request.medicalExaminer() != null) w.setMedicalExaminer(request.medicalExaminer());
        if (request.mechanicApproved() != null) w.setMechanicApproved(request.mechanicApproved());
        if (request.mechanicName() != null) w.setMechanicName(request.mechanicName());
        if (request.mechanicCheckTime() != null) w.setMechanicCheckTime(request.mechanicCheckTime());
        if (request.notes() != null) w.setNotes(request.notes());

        // Recalculate fuel norm if mileage changed
        Vehicle vehicle = vehicleRepository.findById(w.getVehicleId()).orElse(null);
        if (vehicle != null) {
            calculateFuelNorm(w, vehicle);
        }

        w = waybillRepository.save(w);
        return toResponse(w);
    }

    @Transactional
    public FleetWaybillResponse changeStatus(UUID id, WaybillStatus newStatus) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        FleetWaybill w = waybillRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден"));
        if (!orgId.equals(w.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден");
        }

        w.setStatus(newStatus);

        // When completing, update vehicle mileage/hours
        if (newStatus == WaybillStatus.COMPLETED) {
            Vehicle vehicle = vehicleRepository.findById(w.getVehicleId()).orElse(null);
            if (vehicle != null) {
                if (w.getMileageEnd() != null) {
                    vehicle.setCurrentMileage(w.getMileageEnd());
                }
                if (w.getEngineHoursEnd() != null) {
                    vehicle.setCurrentHours(w.getEngineHoursEnd());
                }
                vehicleRepository.save(vehicle);
            }
        }

        w = waybillRepository.save(w);
        log.info("Fleet waybill {} status changed to {}", w.getNumber(), newStatus);
        return toResponse(w);
    }

    @Transactional
    public void deleteWaybill(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        FleetWaybill w = waybillRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден"));
        if (!orgId.equals(w.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Путевой лист не найден");
        }
        w.softDelete();
        waybillRepository.save(w);
        log.info("Fleet waybill deleted: {}", id);
    }

    private void calculateFuelNorm(FleetWaybill w, Vehicle vehicle) {
        BigDecimal distance = w.getDistance();
        if (distance != null && vehicle.getFuelConsumptionRate() != null) {
            BigDecimal norm = distance.multiply(vehicle.getFuelConsumptionRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            w.setFuelNorm(norm);
        }
    }

    private FleetWaybillResponse toResponse(FleetWaybill w) {
        String vehicleName = null;
        String licensePlate = null;
        Vehicle vehicle = vehicleRepository.findById(w.getVehicleId()).orElse(null);
        if (vehicle != null) {
            vehicleName = vehicle.getMake() + " " + vehicle.getModel();
            licensePlate = vehicle.getLicensePlate();
        }
        String projectName = null;
        if (w.getProjectId() != null) {
            projectName = projectRepository.findById(w.getProjectId())
                    .map(Project::getName)
                    .orElse(null);
        }
        return FleetWaybillResponse.fromEntity(w, vehicleName, licensePlate, projectName);
    }
}
