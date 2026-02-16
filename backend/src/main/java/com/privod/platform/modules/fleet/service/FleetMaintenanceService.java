package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.MaintenanceRecord;
import com.privod.platform.modules.fleet.domain.MaintenanceStatus;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.repository.MaintenanceRecordRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.fleet.web.dto.MaintenanceCostResponse;
import com.privod.platform.modules.fleet.web.dto.MaintenanceRecordResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateMaintenanceRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FleetMaintenanceService {

    private final MaintenanceRecordRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MaintenanceRecordResponse> listMaintenance(UUID vehicleId,
                                                            MaintenanceStatus status,
                                                            Pageable pageable) {
        if (vehicleId != null) {
            return maintenanceRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                    .map(MaintenanceRecordResponse::fromEntity);
        }
        if (status != null) {
            return maintenanceRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(MaintenanceRecordResponse::fromEntity);
        }
        return maintenanceRepository.findAll(pageable)
                .map(MaintenanceRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaintenanceRecordResponse getMaintenance(UUID id) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public MaintenanceRecordResponse schedule(CreateMaintenanceRequest request) {
        // Verify vehicle exists
        vehicleRepository.findById(request.vehicleId())
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Техника не найдена: " + request.vehicleId()));

        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicleId(request.vehicleId())
                .maintenanceType(request.maintenanceType())
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(MaintenanceStatus.PLANNED)
                .cost(request.cost())
                .performedById(request.performedById())
                .vendor(request.vendor())
                .mileageAtService(request.mileageAtService())
                .hoursAtService(request.hoursAtService())
                .nextServiceMileage(request.nextServiceMileage())
                .nextServiceHours(request.nextServiceHours())
                .nextServiceDate(request.nextServiceDate())
                .build();

        record = maintenanceRepository.save(record);
        auditService.logCreate("MaintenanceRecord", record.getId());

        log.info("Maintenance scheduled for vehicle {}: {} ({})",
                request.vehicleId(), request.maintenanceType(), record.getId());
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public MaintenanceRecordResponse updateMaintenance(UUID id, UpdateMaintenanceRequest request) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);

        if (record.getStatus() == MaintenanceStatus.COMPLETED || record.getStatus() == MaintenanceStatus.CANCELLED) {
            throw new IllegalStateException("Нельзя редактировать завершённую или отменённую запись обслуживания");
        }

        if (request.maintenanceType() != null) record.setMaintenanceType(request.maintenanceType());
        if (request.description() != null) record.setDescription(request.description());
        if (request.startDate() != null) record.setStartDate(request.startDate());
        if (request.endDate() != null) record.setEndDate(request.endDate());
        if (request.cost() != null) record.setCost(request.cost());
        if (request.performedById() != null) record.setPerformedById(request.performedById());
        if (request.vendor() != null) record.setVendor(request.vendor());
        if (request.mileageAtService() != null) record.setMileageAtService(request.mileageAtService());
        if (request.hoursAtService() != null) record.setHoursAtService(request.hoursAtService());
        if (request.nextServiceMileage() != null) record.setNextServiceMileage(request.nextServiceMileage());
        if (request.nextServiceHours() != null) record.setNextServiceHours(request.nextServiceHours());
        if (request.nextServiceDate() != null) record.setNextServiceDate(request.nextServiceDate());

        record = maintenanceRepository.save(record);
        auditService.logUpdate("MaintenanceRecord", record.getId(), "multiple", null, null);

        log.info("Maintenance record updated: {}", record.getId());
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public MaintenanceRecordResponse startMaintenance(UUID id) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);

        if (record.getStatus() != MaintenanceStatus.PLANNED) {
            throw new IllegalStateException("Начать можно только запланированное обслуживание");
        }

        record.setStatus(MaintenanceStatus.IN_PROGRESS);
        record = maintenanceRepository.save(record);

        // Update vehicle status to MAINTENANCE
        Vehicle vehicle = vehicleRepository.findById(record.getVehicleId())
                .filter(v -> !v.isDeleted())
                .orElse(null);
        if (vehicle != null) {
            VehicleStatus oldStatus = vehicle.getStatus();
            vehicle.setStatus(VehicleStatus.MAINTENANCE);
            vehicleRepository.save(vehicle);
            auditService.logStatusChange("Vehicle", vehicle.getId(),
                    oldStatus.name(), VehicleStatus.MAINTENANCE.name());
        }

        auditService.logStatusChange("MaintenanceRecord", record.getId(),
                MaintenanceStatus.PLANNED.name(), MaintenanceStatus.IN_PROGRESS.name());

        log.info("Maintenance started for vehicle {}: {}", record.getVehicleId(), record.getId());
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public MaintenanceRecordResponse completeMaintenance(UUID id) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);

        if (record.getStatus() != MaintenanceStatus.IN_PROGRESS) {
            throw new IllegalStateException("Завершить можно только обслуживание в работе");
        }

        record.setStatus(MaintenanceStatus.COMPLETED);
        record.setEndDate(LocalDate.now());
        record = maintenanceRepository.save(record);

        // Update vehicle status back to AVAILABLE
        Vehicle vehicle = vehicleRepository.findById(record.getVehicleId())
                .filter(v -> !v.isDeleted())
                .orElse(null);
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
            auditService.logStatusChange("Vehicle", vehicle.getId(),
                    VehicleStatus.MAINTENANCE.name(), VehicleStatus.AVAILABLE.name());
        }

        auditService.logStatusChange("MaintenanceRecord", record.getId(),
                MaintenanceStatus.IN_PROGRESS.name(), MaintenanceStatus.COMPLETED.name());

        log.info("Maintenance completed for vehicle {}: {}", record.getVehicleId(), record.getId());
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public MaintenanceRecordResponse cancelMaintenance(UUID id) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);

        if (record.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new IllegalStateException("Нельзя отменить завершённое обслуживание");
        }

        MaintenanceStatus oldStatus = record.getStatus();
        record.setStatus(MaintenanceStatus.CANCELLED);
        record = maintenanceRepository.save(record);

        // If vehicle was in maintenance, restore to available
        if (oldStatus == MaintenanceStatus.IN_PROGRESS) {
            Vehicle vehicle = vehicleRepository.findById(record.getVehicleId())
                    .filter(v -> !v.isDeleted())
                    .orElse(null);
            if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
                vehicle.setStatus(VehicleStatus.AVAILABLE);
                vehicleRepository.save(vehicle);
                auditService.logStatusChange("Vehicle", vehicle.getId(),
                        VehicleStatus.MAINTENANCE.name(), VehicleStatus.AVAILABLE.name());
            }
        }

        auditService.logStatusChange("MaintenanceRecord", record.getId(),
                oldStatus.name(), MaintenanceStatus.CANCELLED.name());

        log.info("Maintenance cancelled for vehicle {}: {}", record.getVehicleId(), record.getId());
        return MaintenanceRecordResponse.fromEntity(record);
    }

    @Transactional
    public void deleteMaintenance(UUID id) {
        MaintenanceRecord record = getMaintenanceOrThrow(id);
        record.softDelete();
        maintenanceRepository.save(record);
        auditService.logDelete("MaintenanceRecord", id);
        log.info("Maintenance record deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getUpcomingMaintenance(int daysAhead) {
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return maintenanceRepository.findUpcomingMaintenance(threshold).stream()
                .map(MaintenanceRecordResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> getMaintenanceHistory(UUID vehicleId) {
        return maintenanceRepository.findByVehicleIdAndDeletedFalseOrderByStartDateDesc(vehicleId).stream()
                .map(MaintenanceRecordResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MaintenanceCostResponse getMaintenanceCosts(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));

        BigDecimal totalCost = maintenanceRepository.sumCostByVehicleId(vehicleId);

        return new MaintenanceCostResponse(vehicleId, vehicle.getCode(), totalCost);
    }

    private MaintenanceRecord getMaintenanceOrThrow(UUID id) {
        return maintenanceRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись обслуживания не найдена: " + id));
    }
}
