package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.AssignmentStatus;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleAssignment;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.repository.VehicleAssignmentRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.AssignVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.CreateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.UpdateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.VehicleAssignmentResponse;
import com.privod.platform.modules.fleet.web.dto.VehicleResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository assignmentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<VehicleResponse> listVehicles(String search, VehicleStatus status,
                                               VehicleType vehicleType, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return vehicleRepository.searchVehicles(search.trim(), pageable)
                    .map(VehicleResponse::fromEntity);
        }
        if (status != null) {
            return vehicleRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(VehicleResponse::fromEntity);
        }
        if (vehicleType != null) {
            return vehicleRepository.findByVehicleTypeAndDeletedFalse(vehicleType, pageable)
                    .map(VehicleResponse::fromEntity);
        }
        return vehicleRepository.findByDeletedFalse(pageable)
                .map(VehicleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicle(UUID id) {
        Vehicle vehicle = getVehicleOrThrow(id);
        return VehicleResponse.fromEntity(vehicle);
    }

    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest request) {
        String code = generateVehicleCode();

        Vehicle vehicle = Vehicle.builder()
                .code(code)
                .licensePlate(request.licensePlate())
                .make(request.make())
                .model(request.model())
                .year(request.year())
                .vin(request.vin())
                .vehicleType(request.vehicleType())
                .status(VehicleStatus.AVAILABLE)
                .currentProjectId(request.currentProjectId())
                .currentLocationId(request.currentLocationId())
                .responsibleId(request.responsibleId())
                .purchaseDate(request.purchaseDate())
                .purchasePrice(request.purchasePrice())
                .currentValue(request.currentValue() != null ? request.currentValue() : request.purchasePrice())
                .depreciationRate(request.depreciationRate())
                .fuelType(request.fuelType())
                .fuelConsumptionRate(request.fuelConsumptionRate())
                .currentMileage(request.currentMileage())
                .currentHours(request.currentHours())
                .insuranceExpiryDate(request.insuranceExpiryDate())
                .techInspectionExpiryDate(request.techInspectionExpiryDate())
                .notes(request.notes())
                .build();

        vehicle = vehicleRepository.save(vehicle);
        auditService.logCreate("Vehicle", vehicle.getId());

        log.info("Vehicle created: {} - {} {} ({})", vehicle.getCode(), vehicle.getMake(),
                vehicle.getModel(), vehicle.getId());
        return VehicleResponse.fromEntity(vehicle);
    }

    @Transactional
    public VehicleResponse updateVehicle(UUID id, UpdateVehicleRequest request) {
        Vehicle vehicle = getVehicleOrThrow(id);

        if (request.licensePlate() != null) vehicle.setLicensePlate(request.licensePlate());
        if (request.make() != null) vehicle.setMake(request.make());
        if (request.model() != null) vehicle.setModel(request.model());
        if (request.year() != null) vehicle.setYear(request.year());
        if (request.vin() != null) vehicle.setVin(request.vin());
        if (request.vehicleType() != null) vehicle.setVehicleType(request.vehicleType());
        if (request.currentLocationId() != null) vehicle.setCurrentLocationId(request.currentLocationId());
        if (request.responsibleId() != null) vehicle.setResponsibleId(request.responsibleId());
        if (request.purchaseDate() != null) vehicle.setPurchaseDate(request.purchaseDate());
        if (request.purchasePrice() != null) vehicle.setPurchasePrice(request.purchasePrice());
        if (request.currentValue() != null) vehicle.setCurrentValue(request.currentValue());
        if (request.depreciationRate() != null) vehicle.setDepreciationRate(request.depreciationRate());
        if (request.fuelType() != null) vehicle.setFuelType(request.fuelType());
        if (request.fuelConsumptionRate() != null) vehicle.setFuelConsumptionRate(request.fuelConsumptionRate());
        if (request.currentMileage() != null) vehicle.setCurrentMileage(request.currentMileage());
        if (request.currentHours() != null) vehicle.setCurrentHours(request.currentHours());
        if (request.insuranceExpiryDate() != null) vehicle.setInsuranceExpiryDate(request.insuranceExpiryDate());
        if (request.techInspectionExpiryDate() != null) vehicle.setTechInspectionExpiryDate(request.techInspectionExpiryDate());
        if (request.notes() != null) vehicle.setNotes(request.notes());

        vehicle = vehicleRepository.save(vehicle);
        auditService.logUpdate("Vehicle", vehicle.getId(), "multiple", null, null);

        log.info("Vehicle updated: {} ({})", vehicle.getCode(), vehicle.getId());
        return VehicleResponse.fromEntity(vehicle);
    }

    @Transactional
    public void deleteVehicle(UUID id) {
        Vehicle vehicle = getVehicleOrThrow(id);

        if (vehicle.getStatus() == VehicleStatus.IN_USE) {
            throw new IllegalStateException("Нельзя удалить технику, которая находится в использовании");
        }

        vehicle.softDelete();
        vehicleRepository.save(vehicle);
        auditService.logDelete("Vehicle", vehicle.getId());

        log.info("Vehicle soft-deleted: {} ({})", vehicle.getCode(), vehicle.getId());
    }

    @Transactional
    public VehicleAssignmentResponse assignToProject(UUID vehicleId, AssignVehicleRequest request) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new IllegalStateException(
                    String.format("Техника %s недоступна для назначения (статус: %s)",
                            vehicle.getCode(), vehicle.getStatus().getDisplayName()));
        }

        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }

        UUID assignedById = getCurrentUserId();

        VehicleAssignment assignment = VehicleAssignment.builder()
                .vehicleId(vehicleId)
                .projectId(request.projectId())
                .assignedById(assignedById)
                .operatorId(request.operatorId())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(AssignmentStatus.ACTIVE)
                .dailyRate(request.dailyRate())
                .notes(request.notes())
                .build();

        assignment = assignmentRepository.save(assignment);

        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicle.setCurrentProjectId(request.projectId());
        vehicleRepository.save(vehicle);

        auditService.logStatusChange("Vehicle", vehicle.getId(),
                VehicleStatus.AVAILABLE.name(), VehicleStatus.IN_USE.name());

        log.info("Vehicle {} assigned to project {} (assignment: {})",
                vehicle.getCode(), request.projectId(), assignment.getId());
        return VehicleAssignmentResponse.fromEntity(assignment);
    }

    @Transactional
    public VehicleAssignmentResponse returnFromProject(UUID vehicleId) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);

        if (vehicle.getStatus() != VehicleStatus.IN_USE) {
            throw new IllegalStateException(
                    String.format("Техника %s не находится в использовании", vehicle.getCode()));
        }

        VehicleAssignment assignment = assignmentRepository.findActiveAssignment(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Активное назначение не найдено для техники: " + vehicle.getCode()));

        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setActualReturnDate(LocalDate.now());

        // Calculate total cost if daily rate was set
        if (assignment.getDailyRate() != null) {
            long days = ChronoUnit.DAYS.between(assignment.getStartDate(), LocalDate.now()) + 1;
            assignment.setTotalCost(assignment.getDailyRate().multiply(BigDecimal.valueOf(days)));
        }

        assignment = assignmentRepository.save(assignment);

        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicle.setCurrentProjectId(null);
        vehicleRepository.save(vehicle);

        auditService.logStatusChange("Vehicle", vehicle.getId(),
                VehicleStatus.IN_USE.name(), VehicleStatus.AVAILABLE.name());

        log.info("Vehicle {} returned from project (assignment: {})",
                vehicle.getCode(), assignment.getId());
        return VehicleAssignmentResponse.fromEntity(assignment);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAvailableVehicles() {
        return vehicleRepository.findAvailableVehicles().stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByProject(UUID projectId) {
        return vehicleRepository.findByCurrentProjectIdAndDeletedFalse(projectId).stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getExpiringInsurance(int daysAhead) {
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return vehicleRepository.findByInsuranceExpiringBefore(threshold).stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getExpiringTechInspection(int daysAhead) {
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return vehicleRepository.findByTechInspectionExpiringBefore(threshold).stream()
                .map(VehicleResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateDepreciation(UUID vehicleId) {
        Vehicle vehicle = getVehicleOrThrow(vehicleId);

        if (vehicle.getPurchasePrice() == null || vehicle.getDepreciationRate() == null
                || vehicle.getPurchaseDate() == null) {
            return BigDecimal.ZERO;
        }

        long monthsSincePurchase = ChronoUnit.MONTHS.between(vehicle.getPurchaseDate(), LocalDate.now());
        BigDecimal annualDepreciation = vehicle.getPurchasePrice()
                .multiply(vehicle.getDepreciationRate())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal totalDepreciation = annualDepreciation
                .multiply(BigDecimal.valueOf(monthsSincePurchase))
                .divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);

        BigDecimal currentValue = vehicle.getPurchasePrice().subtract(totalDepreciation);
        if (currentValue.compareTo(BigDecimal.ZERO) < 0) {
            currentValue = BigDecimal.ZERO;
        }

        vehicle.setCurrentValue(currentValue);
        vehicleRepository.save(vehicle);

        return currentValue;
    }

    @Transactional(readOnly = true)
    public Page<VehicleAssignmentResponse> getVehicleAssignments(UUID vehicleId, Pageable pageable) {
        return assignmentRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                .map(VehicleAssignmentResponse::fromEntity);
    }

    Vehicle getVehicleOrThrow(UUID id) {
        return vehicleRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + id));
    }

    private String generateVehicleCode() {
        long seq = vehicleRepository.getNextCodeSequence();
        return String.format("VEH-%05d", seq);
    }

    private UUID getCurrentUserId() {
        return com.privod.platform.infrastructure.security.SecurityUtils.getCurrentUserId().orElse(null);
    }
}
