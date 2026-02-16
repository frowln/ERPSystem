package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.FuelRecord;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.repository.FuelRecordRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateFuelRecordRequest;
import com.privod.platform.modules.fleet.web.dto.FuelConsumptionReportResponse;
import com.privod.platform.modules.fleet.web.dto.FuelRecordResponse;
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
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<FuelRecordResponse> listFuelRecords(UUID vehicleId, UUID projectId, Pageable pageable) {
        if (vehicleId != null) {
            return fuelRecordRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                    .map(FuelRecordResponse::fromEntity);
        }
        if (projectId != null) {
            return fuelRecordRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(FuelRecordResponse::fromEntity);
        }
        return fuelRecordRepository.findAll(pageable).map(FuelRecordResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public FuelRecordResponse getFuelRecord(UUID id) {
        FuelRecord record = getFuelRecordOrThrow(id);
        return FuelRecordResponse.fromEntity(record);
    }

    @Transactional
    public FuelRecordResponse createFuelRecord(CreateFuelRecordRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Техника не найдена: " + request.vehicleId()));

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
        FuelRecord record = getFuelRecordOrThrow(id);

        if (request.vehicleId() != null) record.setVehicleId(request.vehicleId());
        if (request.operatorId() != null) record.setOperatorId(request.operatorId());
        if (request.projectId() != null) record.setProjectId(request.projectId());
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
        FuelRecord record = getFuelRecordOrThrow(id);
        record.softDelete();
        fuelRecordRepository.save(record);
        auditService.logDelete("FuelRecord", record.getId());

        log.info("Fuel record soft-deleted: {}", record.getId());
    }

    @Transactional(readOnly = true)
    public List<FuelRecordResponse> getVehicleFuelHistory(UUID vehicleId) {
        return fuelRecordRepository.findByVehicleIdAndDeletedFalseOrderByFuelDateDesc(vehicleId).stream()
                .map(FuelRecordResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal getFuelCostsByProject(UUID projectId) {
        return fuelRecordRepository.sumCostByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public FuelConsumptionReportResponse getFuelConsumptionReport(UUID vehicleId,
                                                                   LocalDate from, LocalDate to) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));

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

    private FuelRecord getFuelRecordOrThrow(UUID id) {
        return fuelRecordRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись заправки не найдена: " + id));
    }
}
