package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentStatus;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.web.dto.CreateIncidentRequest;
import com.privod.platform.modules.safety.web.dto.IncidentDashboardResponse;
import com.privod.platform.modules.safety.web.dto.IncidentResponse;
import com.privod.platform.modules.safety.web.dto.UpdateIncidentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyIncidentService {

    private final SafetyIncidentRepository incidentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<IncidentResponse> listIncidents(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return incidentRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(IncidentResponse::fromEntity);
        }
        return incidentRepository.findAll(pageable).map(IncidentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncident(UUID id) {
        SafetyIncident incident = getIncidentOrThrow(id);
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request) {
        String number = generateIncidentNumber();

        SafetyIncident incident = SafetyIncident.builder()
                .number(number)
                .incidentDate(request.incidentDate())
                .projectId(request.projectId())
                .locationDescription(request.locationDescription())
                .severity(request.severity())
                .incidentType(request.incidentType())
                .status(IncidentStatus.REPORTED)
                .description(request.description())
                .reportedById(request.reportedById())
                .reportedByName(request.reportedByName())
                .injuredEmployeeId(request.injuredEmployeeId())
                .injuredEmployeeName(request.injuredEmployeeName())
                .witnessNames(request.witnessNames())
                .workDaysLost(request.workDaysLost() != null ? request.workDaysLost() : 0)
                .medicalTreatment(request.medicalTreatment())
                .hospitalization(request.hospitalization())
                .notes(request.notes())
                .build();

        incident = incidentRepository.save(incident);
        auditService.logCreate("SafetyIncident", incident.getId());

        log.info("Safety incident created: {} - {} ({})", incident.getNumber(),
                incident.getSeverity(), incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse updateIncident(UUID id, UpdateIncidentRequest request) {
        SafetyIncident incident = getIncidentOrThrow(id);

        if (request.incidentDate() != null) {
            incident.setIncidentDate(request.incidentDate());
        }
        if (request.projectId() != null) {
            incident.setProjectId(request.projectId());
        }
        if (request.locationDescription() != null) {
            incident.setLocationDescription(request.locationDescription());
        }
        if (request.severity() != null) {
            incident.setSeverity(request.severity());
        }
        if (request.incidentType() != null) {
            incident.setIncidentType(request.incidentType());
        }
        if (request.description() != null) {
            incident.setDescription(request.description());
        }
        if (request.rootCause() != null) {
            incident.setRootCause(request.rootCause());
        }
        if (request.correctiveAction() != null) {
            incident.setCorrectiveAction(request.correctiveAction());
        }
        if (request.reportedById() != null) {
            incident.setReportedById(request.reportedById());
        }
        if (request.reportedByName() != null) {
            incident.setReportedByName(request.reportedByName());
        }
        if (request.investigatorId() != null) {
            incident.setInvestigatorId(request.investigatorId());
        }
        if (request.investigatorName() != null) {
            incident.setInvestigatorName(request.investigatorName());
        }
        if (request.injuredEmployeeId() != null) {
            incident.setInjuredEmployeeId(request.injuredEmployeeId());
        }
        if (request.injuredEmployeeName() != null) {
            incident.setInjuredEmployeeName(request.injuredEmployeeName());
        }
        if (request.witnessNames() != null) {
            incident.setWitnessNames(request.witnessNames());
        }
        if (request.workDaysLost() != null) {
            incident.setWorkDaysLost(request.workDaysLost());
        }
        if (request.medicalTreatment() != null) {
            incident.setMedicalTreatment(request.medicalTreatment());
        }
        if (request.hospitalization() != null) {
            incident.setHospitalization(request.hospitalization());
        }
        if (request.notes() != null) {
            incident.setNotes(request.notes());
        }

        incident = incidentRepository.save(incident);
        auditService.logUpdate("SafetyIncident", incident.getId(), "multiple", null, null);

        log.info("Safety incident updated: {} ({})", incident.getNumber(), incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse investigate(UUID id, UUID investigatorId, String investigatorName) {
        SafetyIncident incident = getIncidentOrThrow(id);

        if (!incident.canTransitionTo(IncidentStatus.UNDER_INVESTIGATION)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести инцидент из статуса %s в %s",
                            incident.getStatus().getDisplayName(),
                            IncidentStatus.UNDER_INVESTIGATION.getDisplayName()));
        }

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(IncidentStatus.UNDER_INVESTIGATION);
        incident.setInvestigatorId(investigatorId);
        incident.setInvestigatorName(investigatorName);

        incident = incidentRepository.save(incident);
        auditService.logStatusChange("SafetyIncident", incident.getId(),
                oldStatus.name(), IncidentStatus.UNDER_INVESTIGATION.name());

        log.info("Safety incident under investigation: {} by {} ({})",
                incident.getNumber(), investigatorName, incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse addCorrectiveAction(UUID id, String rootCause, String correctiveAction) {
        SafetyIncident incident = getIncidentOrThrow(id);

        if (!incident.canTransitionTo(IncidentStatus.CORRECTIVE_ACTION)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести инцидент из статуса %s в %s",
                            incident.getStatus().getDisplayName(),
                            IncidentStatus.CORRECTIVE_ACTION.getDisplayName()));
        }

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(IncidentStatus.CORRECTIVE_ACTION);
        incident.setRootCause(rootCause);
        incident.setCorrectiveAction(correctiveAction);

        incident = incidentRepository.save(incident);
        auditService.logStatusChange("SafetyIncident", incident.getId(),
                oldStatus.name(), IncidentStatus.CORRECTIVE_ACTION.name());

        log.info("Corrective action added for incident: {} ({})",
                incident.getNumber(), incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse resolveIncident(UUID id) {
        SafetyIncident incident = getIncidentOrThrow(id);

        if (!incident.canTransitionTo(IncidentStatus.RESOLVED)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести инцидент из статуса %s в %s",
                            incident.getStatus().getDisplayName(),
                            IncidentStatus.RESOLVED.getDisplayName()));
        }

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolvedAt(Instant.now());

        incident = incidentRepository.save(incident);
        auditService.logStatusChange("SafetyIncident", incident.getId(),
                oldStatus.name(), IncidentStatus.RESOLVED.name());

        log.info("Safety incident resolved: {} ({})", incident.getNumber(), incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public IncidentResponse closeIncident(UUID id) {
        SafetyIncident incident = getIncidentOrThrow(id);

        if (!incident.canTransitionTo(IncidentStatus.CLOSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести инцидент из статуса %s в %s",
                            incident.getStatus().getDisplayName(),
                            IncidentStatus.CLOSED.getDisplayName()));
        }

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(IncidentStatus.CLOSED);

        incident = incidentRepository.save(incident);
        auditService.logStatusChange("SafetyIncident", incident.getId(),
                oldStatus.name(), IncidentStatus.CLOSED.name());

        log.info("Safety incident closed: {} ({})", incident.getNumber(), incident.getId());
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional
    public void deleteIncident(UUID id) {
        SafetyIncident incident = getIncidentOrThrow(id);
        incident.softDelete();
        incidentRepository.save(incident);
        auditService.logDelete("SafetyIncident", id);
        log.info("Safety incident deleted: {} ({})", incident.getNumber(), id);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getProjectIncidents(UUID projectId, Pageable pageable) {
        return incidentRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(IncidentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IncidentDashboardResponse getDashboard(UUID projectId) {
        long totalIncidents = incidentRepository.countTotal(projectId);

        Map<String, Long> severityCounts = new HashMap<>();
        for (Object[] row : incidentRepository.countBySeverity(projectId)) {
            IncidentSeverity sev = (IncidentSeverity) row[0];
            Long count = (Long) row[1];
            severityCounts.put(sev.name(), count);
        }

        Map<String, Long> typeCounts = new HashMap<>();
        for (Object[] row : incidentRepository.countByType(projectId)) {
            IncidentType type = (IncidentType) row[0];
            Long count = (Long) row[1];
            typeCounts.put(type.name(), count);
        }

        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : incidentRepository.countByStatus(projectId)) {
            IncidentStatus status = (IncidentStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        int totalWorkDaysLost = incidentRepository.sumWorkDaysLost(projectId);

        return new IncidentDashboardResponse(
                totalIncidents, severityCounts, typeCounts, statusCounts, totalWorkDaysLost
        );
    }

    private SafetyIncident getIncidentOrThrow(UUID id) {
        return incidentRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Инцидент не найден: " + id));
    }

    private String generateIncidentNumber() {
        long seq = incidentRepository.getNextNumberSequence();
        return String.format("INC-%05d", seq);
    }
}
