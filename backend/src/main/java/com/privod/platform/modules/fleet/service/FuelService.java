package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.fleet.domain.FuelRecord;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.repository.FuelRecordRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateFuelRecordRequest;
import com.privod.platform.modules.fleet.web.dto.FuelConsumptionReportResponse;
import com.privod.platform.modules.fleet.web.dto.FuelRecordResponse;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FuelService {

    private final FuelRecordRepository fuelRecordRepository;
    private final VehicleRepository vehicleRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<FuelRecordResponse> listFuelRecords(UUID vehicleId, UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (vehicleId != null) {
            getVehicleOrThrow(vehicleId, organizationId);
            return fuelRecordRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                    .map(FuelRecordResponse::fromEntity);
        }
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return fuelRecordRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(FuelRecordResponse::fromEntity);
        }
        List<UUID> vehicleIds = getOrganizationVehicleIds(organizationId);
        if (vehicleIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return fuelRecordRepository.findByVehicleIdInAndDeletedFalse(vehicleIds, pageable)
                .map(FuelRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public FuelRecordResponse getFuelRecord(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FuelRecord record = getFuelRecordOrThrow(id, organizationId);
        return FuelRecordResponse.fromEntity(record);
    }

    @Transactional
    public FuelRecordResponse createFuelRecord(CreateFuelRecordRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Vehicle vehicle = getVehicleOrThrow(request.vehicleId(), organizationId);
        validateProjectTenant(request.projectId(), organizationId);
        validateOperatorTenant(request.operatorId(), organizationId);

        BigDecimal totalCost = request.quantity().multiply(request.pricePerUnit())
                .setScale(2, RoundingMode.HALF_UP);

        FuelRecord record = FuelRecord.builder()
                .vehicleId(request.vehicleId())
                .operatorId(request.operatorId())
                .projectId(request.projectId())
                .fuelDate(request.fuelDate())
                .quantity(request.quantity())
                .pricePerUnit(request.pricePerUnit())
                .totalCost(totalCost)
                .mileageAtFuel(request.mileageAtFuel())
                .hoursAtFuel(request.hoursAtFuel())
                .fuelStation(request.fuelStation())
                .receiptNumber(request.receiptNumber())
                .build();

        record = fuelRecordRepository.save(record);

        // Update vehicle mileage/hours if provided
        if (request.mileageAtFuel() != null) {
            vehicle.setCurrentMileage(request.mileageAtFuel());
        }
        if (request.hoursAtFuel() != null) {
            vehicle.setCurrentHours(request.hoursAtFuel());
        }
        vehicleRepository.save(vehicle);

        auditService.logCreate("FuelRecord", record.getId());

        log.info("Fuel record created for vehicle {}: {} liters ({} total) ({})",
                vehicle.getCode(), request.quantity(), totalCost, record.getId());
        return FuelRecordResponse.fromEntity(record);
    }

    @Transactional
    public FuelRecordResponse updateFuelRecord(UUID id, CreateFuelRecordRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FuelRecord record = getFuelRecordOrThrow(id, organizationId);

        if (request.vehicleId() != null) {
            getVehicleOrThrow(request.vehicleId(), organizationId);
            record.setVehicleId(request.vehicleId());
        }
        if (request.operatorId() != null) {
            validateOperatorTenant(request.operatorId(), organizationId);
            record.setOperatorId(request.operatorId());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            record.setProjectId(request.projectId());
        }
        if (request.fuelDate() != null) record.setFuelDate(request.fuelDate());
        if (request.quantity() != null) record.setQuantity(request.quantity());
        if (request.pricePerUnit() != null) record.setPricePerUnit(request.pricePerUnit());
        if (request.quantity() != null && request.pricePerUnit() != null) {
            record.setTotalCost(request.quantity().multiply(request.pricePerUnit())
                    .setScale(2, RoundingMode.HALF_UP));
        }
        if (request.mileageAtFuel() != null) record.setMileageAtFuel(request.mileageAtFuel());
        if (request.hoursAtFuel() != null) record.setHoursAtFuel(request.hoursAtFuel());
        if (request.fuelStation() != null) record.setFuelStation(request.fuelStation());
        if (request.receiptNumber() != null) record.setReceiptNumber(request.receiptNumber());

        record = fuelRecordRepository.save(record);
        auditService.logUpdate("FuelRecord", record.getId(), "multiple", null, null);

        log.info("Fuel record updated: {}", record.getId());
        return FuelRecordResponse.fromEntity(record);
    }

    @Transactional
    public void deleteFuelRecord(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        FuelRecord record = getFuelRecordOrThrow(id, organizationId);
        record.softDelete();
        fuelRecordRepository.save(record);
        auditService.logDelete("FuelRecord", record.getId());

        log.info("Fuel record soft-deleted: {}", record.getId());
    }

    @Transactional(readOnly = true)
    public List<FuelRecordResponse> getVehicleFuelHistory(UUID vehicleId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getVehicleOrThrow(vehicleId, organizationId);
        return fuelRecordRepository.findByVehicleIdAndDeletedFalseOrderByFuelDateDesc(vehicleId).stream()
                .map(FuelRecordResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal getFuelCostsByProject(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        return fuelRecordRepository.sumCostByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public FuelConsumptionReportResponse getFuelConsumptionReport(UUID vehicleId,
                                                                   LocalDate from, LocalDate to) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Vehicle vehicle = getVehicleOrThrow(vehicleId, organizationId);

        BigDecimal totalQuantity = fuelRecordRepository
                .sumQuantityByVehicleIdAndDateRange(vehicleId, from, to);
        BigDecimal totalCost = fuelRecordRepository
                .sumCostByVehicleIdAndDateRange(vehicleId, from, to);

        BigDecimal averagePrice = BigDecimal.ZERO;
        if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
            averagePrice = totalCost.divide(totalQuantity, 2, RoundingMode.HALF_UP);
        }

        return new FuelConsumptionReportResponse(
                vehicleId,
                vehicle.getCode(),
                from,
                to,
                totalQuantity,
                totalCost,
                averagePrice
        );
    }

    private FuelRecord getFuelRecordOrThrow(UUID id, UUID organizationId) {
        FuelRecord record = fuelRecordRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Запись заправки не найдена: " + id));
        getVehicleOrThrow(record.getVehicleId(), organizationId);
        validateProjectTenant(record.getProjectId(), organizationId);
        return record;
    }

    private Vehicle getVehicleOrThrow(UUID vehicleId, UUID organizationId) {
        return vehicleRepository.findByIdAndOrganizationIdAndDeletedFalse(vehicleId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));
    }

    private List<UUID> getOrganizationVehicleIds(UUID organizationId) {
        return vehicleRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }

    private void validateOperatorTenant(UUID operatorId, UUID organizationId) {
        if (operatorId == null) {
            return;
        }
        userRepository.findByIdAndOrganizationIdAndDeletedFalse(operatorId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + operatorId));
    }
}
