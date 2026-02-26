package com.privod.platform.modules.regulatory.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryInspection;
import com.privod.platform.modules.regulatory.repository.PrescriptionRepository;
import com.privod.platform.modules.regulatory.repository.RegulatoryInspectionRepository;
import com.privod.platform.modules.regulatory.web.dto.CreatePrescriptionRequest;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryInspectionRequest;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionResponse;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryInspectionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegulatoryInspectionService {

    private final RegulatoryInspectionRepository inspectionRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RegulatoryInspectionResponse> listInspections(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return inspectionRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(RegulatoryInspectionResponse::fromEntity);
        }
        List<UUID> projectIds = getOrganizationProjectIds(organizationId);
        if (projectIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return inspectionRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable)
                .map(RegulatoryInspectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RegulatoryInspectionResponse getInspection(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RegulatoryInspection inspection = getInspectionOrThrow(id, organizationId);
        return RegulatoryInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public RegulatoryInspectionResponse createInspection(CreateRegulatoryInspectionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (request.projectId() == null) {
            throw new IllegalArgumentException("Проект обязателен для проверки");
        }
        validateProjectTenant(request.projectId(), organizationId);

        RegulatoryInspection inspection = RegulatoryInspection.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .inspectionDate(request.inspectionDate())
                .inspectorName(request.inspectorName())
                .inspectorOrgan(request.inspectorOrgan())
                .inspectionType(request.inspectionType())
                .result(request.result())
                .violations(request.violations())
                .prescriptionsJson(request.prescriptionsJson())
                .deadlineToFix(request.deadlineToFix())
                .actNumber(request.actNumber())
                .actUrl(request.actUrl())
                .build();

        inspection = inspectionRepository.save(inspection);
        auditService.logCreate("RegulatoryInspection", inspection.getId());

        log.info("Regulatory inspection created: {} ({})", inspection.getInspectionDate(), inspection.getId());
        return RegulatoryInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public RegulatoryInspectionResponse updateInspection(UUID id, CreateRegulatoryInspectionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RegulatoryInspection inspection = getInspectionOrThrow(id, organizationId);

        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            inspection.setProjectId(request.projectId());
        }
        if (request.inspectionDate() != null) inspection.setInspectionDate(request.inspectionDate());
        if (request.inspectorName() != null) inspection.setInspectorName(request.inspectorName());
        if (request.inspectorOrgan() != null) inspection.setInspectorOrgan(request.inspectorOrgan());
        if (request.inspectionType() != null) inspection.setInspectionType(request.inspectionType());
        if (request.result() != null) inspection.setResult(request.result());
        if (request.violations() != null) inspection.setViolations(request.violations());
        if (request.prescriptionsJson() != null) inspection.setPrescriptionsJson(request.prescriptionsJson());
        if (request.deadlineToFix() != null) inspection.setDeadlineToFix(request.deadlineToFix());
        if (request.actNumber() != null) inspection.setActNumber(request.actNumber());
        if (request.actUrl() != null) inspection.setActUrl(request.actUrl());

        inspection = inspectionRepository.save(inspection);
        auditService.logUpdate("RegulatoryInspection", inspection.getId(), "multiple", null, null);

        log.info("Regulatory inspection updated: {}", inspection.getId());
        return RegulatoryInspectionResponse.fromEntity(inspection);
    }

    @Transactional
    public void deleteInspection(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RegulatoryInspection inspection = getInspectionOrThrow(id, organizationId);
        inspection.softDelete();
        inspectionRepository.save(inspection);
        auditService.logDelete("RegulatoryInspection", id);
        log.info("Regulatory inspection deleted: {}", id);
    }

    // ---- Prescriptions management within inspection ----

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getInspectionPrescriptions(UUID inspectionId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInspectionOrThrow(inspectionId, organizationId);
        return prescriptionRepository.findByInspectionIdAndDeletedFalse(inspectionId)
                .stream()
                .map(PrescriptionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PrescriptionResponse addPrescription(UUID inspectionId, CreatePrescriptionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getInspectionOrThrow(inspectionId, organizationId);
        validateUserTenant(request.responsibleId(), organizationId);

        long seq = prescriptionRepository.getNextNumberSequence();
        String number = String.format("PRE-%05d", seq);

        Prescription prescription = Prescription.builder()
                .inspectionId(inspectionId)
                .number(number)
                .description(request.description())
                .deadline(request.deadline())
                .responsibleId(request.responsibleId())
                .build();

        prescription = prescriptionRepository.save(prescription);
        auditService.logCreate("Prescription", prescription.getId());

        log.info("Prescription added to inspection {}: {} ({})",
                inspectionId, prescription.getNumber(), prescription.getId());
        return PrescriptionResponse.fromEntity(prescription);
    }

    @Transactional
    public PrescriptionResponse completePrescription(UUID id, String evidenceUrl) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Prescription prescription = getPrescriptionOrThrow(id, organizationId);

        if (prescription.getStatus() == PrescriptionStatus.COMPLETED) {
            throw new IllegalStateException("Предписание уже выполнено");
        }

        PrescriptionStatus oldStatus = prescription.getStatus();
        prescription.setStatus(PrescriptionStatus.COMPLETED);
        prescription.setCompletedAt(Instant.now());
        prescription.setEvidenceUrl(evidenceUrl);

        prescription = prescriptionRepository.save(prescription);
        auditService.logStatusChange("Prescription", prescription.getId(),
                oldStatus.name(), PrescriptionStatus.COMPLETED.name());

        log.info("Prescription completed: {} ({})", prescription.getNumber(), prescription.getId());
        return PrescriptionResponse.fromEntity(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getOverduePrescriptions() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> projectIds = getOrganizationProjectIds(organizationId);
        if (projectIds.isEmpty()) {
            return List.of();
        }
        return prescriptionRepository.findOverdueByProjectIds(projectIds)
                .stream()
                .map(PrescriptionResponse::fromEntity)
                .toList();
    }

    private RegulatoryInspection getInspectionOrThrow(UUID id, UUID organizationId) {
        RegulatoryInspection inspection = inspectionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Надзорная проверка не найдена: " + id));
        validateProjectTenant(inspection.getProjectId(), organizationId);
        return inspection;
    }

    private Prescription getPrescriptionOrThrow(UUID id, UUID organizationId) {
        Prescription prescription = prescriptionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Предписание не найдено: " + id));
        getInspectionOrThrow(prescription.getInspectionId(), organizationId);
        return prescription;
    }

    private List<UUID> getOrganizationProjectIds(UUID organizationId) {
        return projectRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            throw new EntityNotFoundException("Проект не найден: null");
        }
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        if (userId == null) {
            return;
        }
        User user = userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }
    }
}
