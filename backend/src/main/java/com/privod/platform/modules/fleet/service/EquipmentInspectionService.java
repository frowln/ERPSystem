package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.EquipmentInspection;
import com.privod.platform.modules.fleet.domain.InspectionType;
import com.privod.platform.modules.fleet.repository.EquipmentInspectionRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateInspectionRequest;
import com.privod.platform.modules.fleet.web.dto.EquipmentInspectionResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateInspectionRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentInspectionService {

    private final EquipmentInspectionRepository inspectionRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EquipmentInspectionResponse> listInspections(UUID vehicleId, Pageable pageable) {
        if (vehicleId != null) {
            return inspectionRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                    .map(EquipmentInspectionResponse::fromEntity);
        }
        return inspectionRepository.findAll(pageable).map(EquipmentInspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EquipmentInspectionResponse getInspection(UUID id) {
        EquipmentInspection inspection = getInspectionOrThrow(id);
        return EquipmentInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public EquipmentInspectionResponse createInspection(CreateInspectionRequest request) {
        vehicleRepository.findById(request.vehicleId())
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Техника не найдена: " + request.vehicleId()));

        EquipmentInspection inspection = EquipmentInspection.builder()
                .vehicleId(request.vehicleId())
                .inspectorId(request.inspectorId())
                .inspectionDate(request.inspectionDate())
                .inspectionType(request.inspectionType())
                .overallRating(request.overallRating())
                .findings(request.findings())
                .recommendations(request.recommendations())
                .nextInspectionDate(request.nextInspectionDate())
                .build();

        inspection = inspectionRepository.save(inspection);
        auditService.logCreate("EquipmentInspection", inspection.getId());

        log.info("Inspection created for vehicle {}: {} - {} ({})",
                request.vehicleId(), request.inspectionType(),
                request.overallRating(), inspection.getId());
        return EquipmentInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public EquipmentInspectionResponse updateInspection(UUID id, UpdateInspectionRequest request) {
        EquipmentInspection inspection = getInspectionOrThrow(id);

        if (request.inspectorId() != null) inspection.setInspectorId(request.inspectorId());
        if (request.inspectionDate() != null) inspection.setInspectionDate(request.inspectionDate());
        if (request.inspectionType() != null) inspection.setInspectionType(request.inspectionType());
        if (request.overallRating() != null) inspection.setOverallRating(request.overallRating());
        if (request.findings() != null) inspection.setFindings(request.findings());
        if (request.recommendations() != null) inspection.setRecommendations(request.recommendations());
        if (request.nextInspectionDate() != null) inspection.setNextInspectionDate(request.nextInspectionDate());

        inspection = inspectionRepository.save(inspection);
        auditService.logUpdate("EquipmentInspection", inspection.getId(), "multiple", null, null);

        log.info("Inspection updated: {}", inspection.getId());
        return EquipmentInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public void deleteInspection(UUID id) {
        EquipmentInspection inspection = getInspectionOrThrow(id);
        inspection.softDelete();
        inspectionRepository.save(inspection);
        auditService.logDelete("EquipmentInspection", inspection.getId());

        log.info("Inspection soft-deleted: {}", inspection.getId());
    }

    @Transactional(readOnly = true)
    public List<EquipmentInspectionResponse> getDailyCheckList(LocalDate date) {
        LocalDate checkDate = date != null ? date : LocalDate.now();
        return inspectionRepository.findByTypeAndDate(InspectionType.DAILY, checkDate).stream()
                .map(EquipmentInspectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentInspectionResponse> getUpcomingInspections(int daysAhead) {
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        return inspectionRepository.findUpcomingInspections(threshold).stream()
                .map(EquipmentInspectionResponse::fromEntity)
                .toList();
    }

    private EquipmentInspection getInspectionOrThrow(UUID id) {
        return inspectionRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Осмотр не найден: " + id));
    }
}
