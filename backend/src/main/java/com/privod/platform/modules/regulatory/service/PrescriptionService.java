package com.privod.platform.modules.regulatory.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;
import com.privod.platform.modules.regulatory.repository.PrescriptionRepository;
import com.privod.platform.modules.regulatory.web.dto.CreatePrescriptionRequest;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionDashboardResponse;
import com.privod.platform.modules.regulatory.web.dto.PrescriptionResponse;
import com.privod.platform.modules.regulatory.web.dto.UpdatePrescriptionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> listPrescriptions(UUID projectId, PrescriptionStatus status,
                                                         RegulatoryBodyType bodyType, String search, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return prescriptionRepository.findAllFiltered(orgId, projectId, status, bodyType, search, pageable)
                .map(p -> PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId())));
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescription(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prescription p = prescriptionRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предписание не найдено"));
        return PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId()));
    }

    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        long seq = prescriptionRepository.getNextNumberSequence();

        Prescription p = Prescription.builder()
                .organizationId(orgId)
                .inspectionId(request.inspectionId())
                .projectId(request.projectId())
                .number("ПР-" + String.format("%05d", seq))
                .description(request.description())
                .regulatoryBodyType(request.regulatoryBodyType())
                .receivedDate(request.receivedDate() != null ? request.receivedDate() : LocalDate.now())
                .deadline(request.deadline())
                .appealDeadline(request.appealDeadline())
                .responsibleId(request.responsibleId())
                .responsibleName(request.responsibleName())
                .fineAmount(request.fineAmount())
                .violationCount(request.violationCount() != null ? request.violationCount() : 1)
                .regulatoryReference(request.regulatoryReference())
                .notes(request.notes())
                .status(PrescriptionStatus.RECEIVED)
                .build();

        p = prescriptionRepository.save(p);

        // Notify responsible person
        if (p.getResponsibleId() != null) {
            notificationService.send(
                    p.getResponsibleId(),
                    "Новое предписание " + p.getNumber(),
                    "Получено предписание от " + (p.getRegulatoryBodyType() != null ? p.getRegulatoryBodyType().getDisplayName() : "надзорного органа")
                            + ". Срок устранения: " + (p.getDeadline() != null ? p.getDeadline().toString() : "не указан"),
                    NotificationType.WARNING,
                    "Prescription",
                    p.getId(),
                    "/regulatory/prescriptions/" + p.getId()
            );
        }

        return PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId()));
    }

    @Transactional
    public PrescriptionResponse updatePrescription(UUID id, UpdatePrescriptionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prescription p = prescriptionRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предписание не найдено"));

        if (request.description() != null) p.setDescription(request.description());
        if (request.regulatoryBodyType() != null) p.setRegulatoryBodyType(request.regulatoryBodyType());
        if (request.projectId() != null) p.setProjectId(request.projectId());
        if (request.receivedDate() != null) p.setReceivedDate(request.receivedDate());
        if (request.deadline() != null) p.setDeadline(request.deadline());
        if (request.appealDeadline() != null) p.setAppealDeadline(request.appealDeadline());
        if (request.responsibleId() != null) p.setResponsibleId(request.responsibleId());
        if (request.responsibleName() != null) p.setResponsibleName(request.responsibleName());
        if (request.fineAmount() != null) p.setFineAmount(request.fineAmount());
        if (request.correctiveActionCost() != null) p.setCorrectiveActionCost(request.correctiveActionCost());
        if (request.violationCount() != null) p.setViolationCount(request.violationCount());
        if (request.regulatoryReference() != null) p.setRegulatoryReference(request.regulatoryReference());
        if (request.evidenceUrl() != null) p.setEvidenceUrl(request.evidenceUrl());
        if (request.responseLetterUrl() != null) p.setResponseLetterUrl(request.responseLetterUrl());
        if (request.notes() != null) p.setNotes(request.notes());

        p = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId()));
    }

    @Transactional
    public PrescriptionResponse changeStatus(UUID id, PrescriptionStatus newStatus) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prescription p = prescriptionRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предписание не найдено"));

        p.setStatus(newStatus);
        if (newStatus == PrescriptionStatus.COMPLETED || newStatus == PrescriptionStatus.CLOSED) {
            p.setCompletedAt(Instant.now());
        }
        if (newStatus == PrescriptionStatus.RESPONSE_SUBMITTED) {
            p.setResponseSubmittedAt(Instant.now());
            p.setResponseDate(LocalDate.now());
        }

        p = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId()));
    }

    @Transactional
    public PrescriptionResponse fileAppeal(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prescription p = prescriptionRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предписание не найдено"));

        if (!p.isAppealWindowOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Срок обжалования истёк");
        }

        p.setAppealFiled(true);
        p.setAppealDate(LocalDate.now());
        p.setStatus(PrescriptionStatus.APPEALED);

        p = prescriptionRepository.save(p);
        return PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId()));
    }

    @Transactional
    public void deletePrescription(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Prescription p = prescriptionRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предписание не найдено"));
        p.softDelete();
        prescriptionRepository.save(p);
    }

    @Transactional(readOnly = true)
    public PrescriptionDashboardResponse getDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalActive = prescriptionRepository.countActiveByOrg(orgId);
        long totalOverdue = prescriptionRepository.countOverdueByOrg(orgId);
        BigDecimal totalFines = prescriptionRepository.sumFinesByOrg(orgId);

        // By status
        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : prescriptionRepository.countByStatusForOrg(orgId)) {
            byStatus.put(((PrescriptionStatus) row[0]).name(), (Long) row[1]);
        }
        long totalCompleted = byStatus.getOrDefault("COMPLETED", 0L) + byStatus.getOrDefault("CLOSED", 0L);

        // By body type
        List<PrescriptionDashboardResponse.BodyTypeCount> byBodyType = prescriptionRepository.countActiveByBodyTypeForOrg(orgId)
                .stream()
                .map(row -> {
                    RegulatoryBodyType bt = (RegulatoryBodyType) row[0];
                    return new PrescriptionDashboardResponse.BodyTypeCount(
                            bt != null ? bt.name() : "UNKNOWN",
                            bt != null ? bt.getDisplayName() : "Неизвестно",
                            (Long) row[1]);
                })
                .toList();

        // Approaching deadline (next 7 days)
        List<PrescriptionResponse> approaching = prescriptionRepository.findApproachingDeadline(orgId, LocalDate.now().plusDays(7))
                .stream()
                .map(p -> PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId())))
                .toList();

        // Overdue
        List<PrescriptionResponse> overdue = prescriptionRepository.findOverdueByOrganizationId(orgId)
                .stream()
                .map(p -> PrescriptionResponse.fromEntity(p, resolveProjectName(p.getProjectId())))
                .toList();

        return new PrescriptionDashboardResponse(
                totalActive, totalOverdue, totalCompleted, totalFines,
                byStatus, byBodyType, approaching, overdue
        );
    }

    private String resolveProjectName(UUID projectId) {
        if (projectId == null) return null;
        return projectRepository.findById(projectId)
                .map(Project::getName)
                .orElse(null);
    }
}
