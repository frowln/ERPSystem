package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.InspectionStatus;
import com.privod.platform.modules.safety.domain.SafetyInspection;
import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.repository.SafetyInspectionRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.web.dto.CreateInspectionRequest;
import com.privod.platform.modules.safety.web.dto.CreateViolationRequest;
import com.privod.platform.modules.safety.web.dto.InspectionResponse;
import com.privod.platform.modules.safety.web.dto.UpdateInspectionRequest;
import com.privod.platform.modules.safety.web.dto.ViolationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyInspectionService {

    private final SafetyInspectionRepository inspectionRepository;
    private final SafetyViolationRepository violationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<InspectionResponse> listInspections(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return inspectionRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(InspectionResponse::fromEntity);
        }
        return inspectionRepository.findAll(pageable).map(InspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public InspectionResponse getInspection(UUID id) {
        SafetyInspection inspection = getInspectionOrThrow(id);
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public InspectionResponse createInspection(CreateInspectionRequest request) {
        String number = generateInspectionNumber();

        SafetyInspection inspection = SafetyInspection.builder()
                .number(number)
                .inspectionDate(request.inspectionDate())
                .projectId(request.projectId())
                .inspectorId(request.inspectorId())
                .inspectorName(request.inspectorName())
                .inspectionType(request.inspectionType())
                .status(InspectionStatus.PLANNED)
                .notes(request.notes())
                .build();

        inspection = inspectionRepository.save(inspection);
        auditService.logCreate("SafetyInspection", inspection.getId());

        log.info("Safety inspection created: {} ({})", inspection.getNumber(), inspection.getId());
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public InspectionResponse updateInspection(UUID id, UpdateInspectionRequest request) {
        SafetyInspection inspection = getInspectionOrThrow(id);

        if (request.inspectionDate() != null) {
            inspection.setInspectionDate(request.inspectionDate());
        }
        if (request.projectId() != null) {
            inspection.setProjectId(request.projectId());
        }
        if (request.inspectorId() != null) {
            inspection.setInspectorId(request.inspectorId());
        }
        if (request.inspectorName() != null) {
            inspection.setInspectorName(request.inspectorName());
        }
        if (request.inspectionType() != null) {
            inspection.setInspectionType(request.inspectionType());
        }
        if (request.status() != null) {
            inspection.setStatus(request.status());
        }
        if (request.overallRating() != null) {
            inspection.setOverallRating(request.overallRating());
        }
        if (request.findings() != null) {
            inspection.setFindings(request.findings());
        }
        if (request.recommendations() != null) {
            inspection.setRecommendations(request.recommendations());
        }
        if (request.nextInspectionDate() != null) {
            inspection.setNextInspectionDate(request.nextInspectionDate());
        }
        if (request.notes() != null) {
            inspection.setNotes(request.notes());
        }

        inspection = inspectionRepository.save(inspection);
        auditService.logUpdate("SafetyInspection", inspection.getId(), "multiple", null, null);

        log.info("Safety inspection updated: {} ({})", inspection.getNumber(), inspection.getId());
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public InspectionResponse startInspection(UUID id) {
        SafetyInspection inspection = getInspectionOrThrow(id);

        if (inspection.getStatus() != InspectionStatus.PLANNED) {
            throw new IllegalStateException("Начать можно только запланированную проверку");
        }

        InspectionStatus oldStatus = inspection.getStatus();
        inspection.setStatus(InspectionStatus.IN_PROGRESS);
        inspection = inspectionRepository.save(inspection);
        auditService.logStatusChange("SafetyInspection", inspection.getId(),
                oldStatus.name(), InspectionStatus.IN_PROGRESS.name());

        log.info("Safety inspection started: {} ({})", inspection.getNumber(), inspection.getId());
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public InspectionResponse completeInspection(UUID id) {
        SafetyInspection inspection = getInspectionOrThrow(id);

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Завершить можно только проверку в процессе выполнения");
        }

        InspectionStatus oldStatus = inspection.getStatus();
        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection = inspectionRepository.save(inspection);
        auditService.logStatusChange("SafetyInspection", inspection.getId(),
                oldStatus.name(), InspectionStatus.COMPLETED.name());

        log.info("Safety inspection completed: {} ({})", inspection.getNumber(), inspection.getId());
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public InspectionResponse cancelInspection(UUID id) {
        SafetyInspection inspection = getInspectionOrThrow(id);

        if (inspection.getStatus() == InspectionStatus.COMPLETED ||
                inspection.getStatus() == InspectionStatus.CANCELLED) {
            throw new IllegalStateException("Невозможно отменить завершённую или уже отменённую проверку");
        }

        InspectionStatus oldStatus = inspection.getStatus();
        inspection.setStatus(InspectionStatus.CANCELLED);
        inspection = inspectionRepository.save(inspection);
        auditService.logStatusChange("SafetyInspection", inspection.getId(),
                oldStatus.name(), InspectionStatus.CANCELLED.name());

        log.info("Safety inspection cancelled: {} ({})", inspection.getNumber(), inspection.getId());
        return InspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public void deleteInspection(UUID id) {
        SafetyInspection inspection = getInspectionOrThrow(id);
        inspection.softDelete();
        inspectionRepository.save(inspection);
        auditService.logDelete("SafetyInspection", id);
        log.info("Safety inspection deleted: {} ({})", inspection.getNumber(), id);
    }

    // ---- Violations management within inspection ----

    @Transactional(readOnly = true)
    public List<ViolationResponse> getInspectionViolations(UUID inspectionId) {
        getInspectionOrThrow(inspectionId);
        return violationRepository.findByInspectionIdAndDeletedFalse(inspectionId)
                .stream()
                .map(ViolationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ViolationResponse addViolationToInspection(UUID inspectionId, CreateViolationRequest request) {
        getInspectionOrThrow(inspectionId);

        SafetyViolation violation = SafetyViolation.builder()
                .inspectionId(inspectionId)
                .incidentId(request.incidentId())
                .description(request.description())
                .severity(request.severity())
                .dueDate(request.dueDate())
                .assignedToId(request.assignedToId())
                .assignedToName(request.assignedToName())
                .build();

        violation = violationRepository.save(violation);
        auditService.logCreate("SafetyViolation", violation.getId());

        log.info("Violation added to inspection {}: {} ({})",
                inspectionId, violation.getDescription(), violation.getId());
        return ViolationResponse.fromEntity(violation);
    }

    private SafetyInspection getInspectionOrThrow(UUID id) {
        return inspectionRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проверка не найдена: " + id));
    }

    private String generateInspectionNumber() {
        long seq = inspectionRepository.getNextNumberSequence();
        return String.format("INS-%05d", seq);
    }
}
