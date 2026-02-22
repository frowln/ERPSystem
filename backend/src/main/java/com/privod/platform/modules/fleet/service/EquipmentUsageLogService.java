package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.fleet.domain.EquipmentUsageLog;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.repository.EquipmentUsageLogRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.CreateEquipmentUsageLogRequest;
import com.privod.platform.modules.fleet.web.dto.EquipmentUsageLogResponse;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentUsageLogService {

    private final EquipmentUsageLogRepository usageLogRepository;
    private final VehicleRepository vehicleRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EquipmentUsageLogResponse> list(UUID vehicleId, UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (vehicleId != null) {
            getVehicleOrThrow(vehicleId, organizationId);
            return usageLogRepository.findByOrganizationIdAndVehicleIdAndDeletedFalse(
                    organizationId, vehicleId, pageable).map(this::toResponse);
        }
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return usageLogRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(
                    organizationId, projectId, pageable).map(this::toResponse);
        }
        return usageLogRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EquipmentUsageLogResponse getById(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentUsageLog logEntry = getLogOrThrow(id, organizationId);
        return toResponse(logEntry);
    }

    @Transactional
    public EquipmentUsageLogResponse create(CreateEquipmentUsageLogRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Vehicle vehicle = getVehicleOrThrow(request.vehicleId(), organizationId);
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
        }

        BigDecimal hoursWorked = request.hoursWorked();
        if (request.hoursStart() != null && request.hoursEnd() != null && hoursWorked.compareTo(BigDecimal.ZERO) == 0) {
            hoursWorked = request.hoursEnd().subtract(request.hoursStart());
        }

        EquipmentUsageLog logEntry = EquipmentUsageLog.builder()
                .organizationId(organizationId)
                .vehicleId(request.vehicleId())
                .projectId(request.projectId())
                .operatorId(request.operatorId())
                .operatorName(request.operatorName())
                .usageDate(request.usageDate())
                .hoursWorked(hoursWorked)
                .hoursStart(request.hoursStart())
                .hoursEnd(request.hoursEnd())
                .fuelConsumed(request.fuelConsumed())
                .description(request.description())
                .notes(request.notes())
                .build();

        logEntry = usageLogRepository.save(logEntry);

        // Update vehicle's currentHours if hoursEnd is provided
        if (request.hoursEnd() != null) {
            vehicle.setCurrentHours(request.hoursEnd());
            vehicleRepository.save(vehicle);
        }

        auditService.logCreate("EquipmentUsageLog", logEntry.getId());
        log.info("Equipment usage log created for vehicle {}: {} hours ({})",
                vehicle.getCode(), hoursWorked, logEntry.getId());

        return toResponse(logEntry);
    }

    @Transactional
    public EquipmentUsageLogResponse update(UUID id, CreateEquipmentUsageLogRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentUsageLog logEntry = getLogOrThrow(id, organizationId);

        if (request.vehicleId() != null) {
            getVehicleOrThrow(request.vehicleId(), organizationId);
            logEntry.setVehicleId(request.vehicleId());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            logEntry.setProjectId(request.projectId());
        }
        if (request.operatorId() != null) logEntry.setOperatorId(request.operatorId());
        if (request.operatorName() != null) logEntry.setOperatorName(request.operatorName());
        if (request.usageDate() != null) logEntry.setUsageDate(request.usageDate());
        if (request.hoursStart() != null) logEntry.setHoursStart(request.hoursStart());
        if (request.hoursEnd() != null) logEntry.setHoursEnd(request.hoursEnd());
        if (request.hoursWorked() != null) logEntry.setHoursWorked(request.hoursWorked());
        if (request.fuelConsumed() != null) logEntry.setFuelConsumed(request.fuelConsumed());
        if (request.description() != null) logEntry.setDescription(request.description());
        if (request.notes() != null) logEntry.setNotes(request.notes());

        logEntry = usageLogRepository.save(logEntry);
        auditService.logUpdate("EquipmentUsageLog", logEntry.getId(), "multiple", null, null);

        log.info("Equipment usage log updated: {}", logEntry.getId());
        return toResponse(logEntry);
    }

    @Transactional
    public void delete(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        EquipmentUsageLog logEntry = getLogOrThrow(id, organizationId);
        logEntry.softDelete();
        usageLogRepository.save(logEntry);
        auditService.logDelete("EquipmentUsageLog", logEntry.getId());
        log.info("Equipment usage log soft-deleted: {}", logEntry.getId());
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalHoursForVehicle(UUID vehicleId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getVehicleOrThrow(vehicleId, organizationId);
        return usageLogRepository.sumHoursWorkedByVehicleId(vehicleId);
    }

    private EquipmentUsageLogResponse toResponse(EquipmentUsageLog logEntry) {
        String vehicleName = null;
        String projectName = null;

        var vehicleOpt = vehicleRepository.findById(logEntry.getVehicleId())
                .filter(v -> !v.isDeleted());
        if (vehicleOpt.isPresent()) {
            Vehicle v = vehicleOpt.get();
            vehicleName = v.getMake() != null
                    ? v.getMake() + " " + (v.getModel() != null ? v.getModel() : "") + " (" + v.getCode() + ")"
                    : v.getCode();
        }

        if (logEntry.getProjectId() != null) {
            projectName = projectRepository.findById(logEntry.getProjectId())
                    .filter(p -> !p.isDeleted())
                    .map(Project::getName)
                    .orElse(null);
        }

        return EquipmentUsageLogResponse.fromEntity(logEntry, vehicleName, projectName);
    }

    private EquipmentUsageLog getLogOrThrow(UUID id, UUID organizationId) {
        EquipmentUsageLog logEntry = usageLogRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Запись использования не найдена: " + id));
        if (!organizationId.equals(logEntry.getOrganizationId())) {
            throw new EntityNotFoundException("Запись использования не найдена: " + id);
        }
        return logEntry;
    }

    private Vehicle getVehicleOrThrow(UUID vehicleId, UUID organizationId) {
        return vehicleRepository.findByIdAndOrganizationIdAndDeletedFalse(vehicleId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) return;
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }
}
