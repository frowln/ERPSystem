package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EquipmentInspectionResponse> listInspections(UUID vehicleId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (vehicleId != null) {
            getVehicleOrThrow(vehicleId, organizationId);
            return inspectionRepository.findByVehicleIdAndDeletedFalse(vehicleId, pageable)
                    .map(EquipmentInspectionResponse::fromEntity);
        }
        List<UUID> vehicleIds = getOrganizationVehicleIds(organizationId);
        if (vehicleIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return inspectionRepository.findByVehicleIdInAndDeletedFalse(vehicleIds, pageable)
                .map(EquipmentInspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EquipmentInspectionResponse getInspection(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentInspection inspection = getInspectionOrThrow(id, organizationId);
        return EquipmentInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public EquipmentInspectionResponse createInspection(CreateInspectionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getVehicleOrThrow(request.vehicleId(), organizationId);
        validateInspectorTenant(request.inspectorId(), organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentInspection inspection = getInspectionOrThrow(id, organizationId);

        validateInspectorTenant(request.inspectorId(), organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentInspection inspection = getInspectionOrThrow(id, organizationId);
        inspection.softDelete();
        inspectionRepository.save(inspection);
        auditService.logDelete("EquipmentInspection", inspection.getId());

        log.info("Inspection soft-deleted: {}", inspection.getId());
    }

    @Transactional(readOnly = true)
    public List<EquipmentInspectionResponse> getDailyCheckList(LocalDate date) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate checkDate = date != null ? date : LocalDate.now();
        List<UUID> vehicleIds = getOrganizationVehicleIds(organizationId);
        if (vehicleIds.isEmpty()) {
            return List.of();
        }
        return inspectionRepository.findByTypeAndDateAndVehicleIds(InspectionType.DAILY, checkDate, vehicleIds).stream()
                .map(EquipmentInspectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentInspectionResponse> getUpcomingInspections(int daysAhead) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate threshold = LocalDate.now().plusDays(daysAhead);
        List<UUID> vehicleIds = getOrganizationVehicleIds(organizationId);
        if (vehicleIds.isEmpty()) {
            return List.of();
        }
        return inspectionRepository.findUpcomingInspectionsByVehicleIds(vehicleIds, threshold).stream()
                .map(EquipmentInspectionResponse::fromEntity)
                .toList();
    }

    private EquipmentInspection getInspectionOrThrow(UUID id, UUID organizationId) {
        EquipmentInspection inspection = inspectionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Осмотр не найден: " + id));
        getVehicleOrThrow(inspection.getVehicleId(), organizationId);
        return inspection;
    }

    private void validateInspectorTenant(UUID inspectorId, UUID organizationId) {
        if (inspectorId == null) {
            return;
        }
        userRepository.findByIdAndOrganizationIdAndDeletedFalse(inspectorId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + inspectorId));
    }

    private void getVehicleOrThrow(UUID vehicleId, UUID organizationId) {
        vehicleRepository.findByIdAndOrganizationIdAndDeletedFalse(vehicleId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));
    }

    private List<UUID> getOrganizationVehicleIds(UUID organizationId) {
        return vehicleRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }
}
