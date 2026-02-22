package com.privod.platform.modules.portal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.portal.domain.ClientDocumentSignature;
import com.privod.platform.modules.portal.domain.ClientMilestone;
import com.privod.platform.modules.portal.domain.ClientProgressSnapshot;
import com.privod.platform.modules.portal.domain.MilestoneStatus;
import com.privod.platform.modules.portal.domain.PortalProject;
import com.privod.platform.modules.portal.domain.SignatureStatus;
import com.privod.platform.modules.portal.repository.ClientDocumentSignatureRepository;
import com.privod.platform.modules.portal.repository.ClientMilestoneRepository;
import com.privod.platform.modules.portal.repository.ClientProgressSnapshotRepository;
import com.privod.platform.modules.portal.repository.PortalProjectRepository;
import com.privod.platform.modules.portal.web.dto.ClientDashboardResponse;
import com.privod.platform.modules.portal.web.dto.ClientMilestoneResponse;
import com.privod.platform.modules.portal.web.dto.CreateDocumentSignatureRequest;
import com.privod.platform.modules.portal.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.portal.web.dto.CreateProgressSnapshotRequest;
import com.privod.platform.modules.portal.web.dto.DocumentSignatureResponse;
import com.privod.platform.modules.portal.web.dto.ProgressSnapshotResponse;
import com.privod.platform.modules.portal.web.dto.RejectDocumentRequest;
import com.privod.platform.modules.portal.web.dto.SignDocumentRequest;
import com.privod.platform.modules.portal.web.dto.UpdateMilestoneRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientPortalService {

    private final ClientProgressSnapshotRepository snapshotRepository;
    private final ClientDocumentSignatureRepository signatureRepository;
    private final ClientMilestoneRepository milestoneRepository;
    private final PortalProjectRepository portalProjectRepository;
    private final ProjectRepository projectRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;

    // ============================================================
    // Progress Snapshots
    // ============================================================

    @Transactional
    public ProgressSnapshotResponse createProgressSnapshot(CreateProgressSnapshotRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        ClientProgressSnapshot snapshot = ClientProgressSnapshot.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .snapshotDate(request.snapshotDate())
                .overallPercent(request.overallPercent())
                .description(request.description())
                .milestoneSummaryJson(request.milestoneSummaryJson())
                .photoReportJson(request.photoReportJson())
                .weatherNotes(request.weatherNotes())
                .createdByUserId(userId)
                .published(request.publish())
                .publishedAt(request.publish() ? Instant.now() : null)
                .build();

        snapshot = snapshotRepository.save(snapshot);
        auditService.logCreate("ClientProgressSnapshot", snapshot.getId());

        log.info("Снимок прогресса создан: project={}, date={}, percent={}%",
                request.projectId(), request.snapshotDate(), request.overallPercent());
        return ProgressSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional
    public ProgressSnapshotResponse publishSnapshot(UUID id) {
        ClientProgressSnapshot snapshot = snapshotRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Снимок прогресса не найден: " + id));

        if (snapshot.isPublished()) {
            throw new IllegalStateException("Снимок уже опубликован");
        }

        snapshot.setPublished(true);
        snapshot.setPublishedAt(Instant.now());
        snapshot = snapshotRepository.save(snapshot);

        auditService.logUpdate("ClientProgressSnapshot", id, "published", "false", "true");
        log.info("Снимок прогресса опубликован: {}", id);
        return ProgressSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional(readOnly = true)
    public Page<ProgressSnapshotResponse> getPublishedSnapshots(UUID projectId, Pageable pageable) {
        return snapshotRepository.findByProjectIdAndPublishedTrueAndDeletedFalse(projectId, pageable)
                .map(ProgressSnapshotResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ProgressSnapshotResponse> getAllSnapshots(UUID projectId, Pageable pageable) {
        return snapshotRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ProgressSnapshotResponse::fromEntity);
    }

    // ============================================================
    // Document Signatures
    // ============================================================

    @Transactional
    public DocumentSignatureResponse requestSignature(CreateDocumentSignatureRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ClientDocumentSignature signature = ClientDocumentSignature.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .portalUserId(request.portalUserId())
                .documentId(request.documentId())
                .documentTitle(request.documentTitle())
                .documentUrl(request.documentUrl())
                .signatureStatus(SignatureStatus.PENDING)
                .expiresAt(request.expiresAt())
                .build();

        signature = signatureRepository.save(signature);
        auditService.logCreate("ClientDocumentSignature", signature.getId());

        log.info("Запрос на подписание документа создан: document='{}', portalUser={}",
                request.documentTitle(), request.portalUserId());
        return DocumentSignatureResponse.fromEntity(signature);
    }

    @Transactional
    public DocumentSignatureResponse signDocument(UUID signatureId, SignDocumentRequest request) {
        ClientDocumentSignature signature = getSignatureOrThrow(signatureId);

        if (signature.getSignatureStatus() != SignatureStatus.PENDING) {
            throw new IllegalStateException(
                    "Подписание возможно только для документов в статусе 'Ожидает подписания'. Текущий статус: "
                            + signature.getSignatureStatus().getDisplayName());
        }

        if (signature.isExpired()) {
            signature.setSignatureStatus(SignatureStatus.EXPIRED);
            signatureRepository.save(signature);
            throw new IllegalStateException("Срок подписания документа истёк");
        }

        signature.setSignatureStatus(SignatureStatus.SIGNED);
        signature.setSignedAt(Instant.now());
        signature = signatureRepository.save(signature);

        auditService.logStatusChange("ClientDocumentSignature", signatureId,
                SignatureStatus.PENDING.name(), SignatureStatus.SIGNED.name());
        log.info("Документ подписан: {} ({})", signature.getDocumentTitle(), signatureId);
        return DocumentSignatureResponse.fromEntity(signature);
    }

    @Transactional
    public DocumentSignatureResponse rejectDocument(UUID signatureId, RejectDocumentRequest request) {
        ClientDocumentSignature signature = getSignatureOrThrow(signatureId);

        if (signature.getSignatureStatus() != SignatureStatus.PENDING) {
            throw new IllegalStateException(
                    "Отклонение возможно только для документов в статусе 'Ожидает подписания'. Текущий статус: "
                            + signature.getSignatureStatus().getDisplayName());
        }

        signature.setSignatureStatus(SignatureStatus.REJECTED);
        signature.setRejectedReason(request.reason());
        signature = signatureRepository.save(signature);

        auditService.logStatusChange("ClientDocumentSignature", signatureId,
                SignatureStatus.PENDING.name(), SignatureStatus.REJECTED.name());
        log.info("Документ отклонён: {} ({}), причина: '{}'",
                signature.getDocumentTitle(), signatureId, request.reason());
        return DocumentSignatureResponse.fromEntity(signature);
    }

    @Transactional(readOnly = true)
    public Page<DocumentSignatureResponse> getSignaturesForPortalUser(
            UUID portalUserId, Pageable pageable) {
        return signatureRepository.findByPortalUserIdAndSignatureStatusAndDeletedFalse(
                        portalUserId, SignatureStatus.PENDING, pageable)
                .map(DocumentSignatureResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DocumentSignatureResponse> getSignaturesByProject(
            UUID projectId, Pageable pageable) {
        return signatureRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(DocumentSignatureResponse::fromEntity);
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void checkExpiredSignatures() {
        List<ClientDocumentSignature> expired = signatureRepository.findExpiredPending(Instant.now());
        int count = 0;

        for (ClientDocumentSignature sig : expired) {
            sig.setSignatureStatus(SignatureStatus.EXPIRED);
            signatureRepository.save(sig);
            auditService.logStatusChange("ClientDocumentSignature", sig.getId(),
                    SignatureStatus.PENDING.name(), SignatureStatus.EXPIRED.name());
            count++;
        }

        if (count > 0) {
            log.warn("Истёк срок подписания для {} документов", count);
        } else {
            log.info("Проверка истекших подписей завершена: просроченных не обнаружено");
        }
    }

    // ============================================================
    // Milestones
    // ============================================================

    @Transactional
    public ClientMilestoneResponse createMilestone(CreateMilestoneRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ClientMilestone milestone = ClientMilestone.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .title(request.title())
                .description(request.description())
                .targetDate(request.targetDate())
                .actualDate(request.actualDate())
                .status(request.status() != null ? request.status() : MilestoneStatus.UPCOMING)
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .visibleToClient(request.visibleToClient() != null ? request.visibleToClient() : true)
                .build();

        milestone = milestoneRepository.save(milestone);
        auditService.logCreate("ClientMilestone", milestone.getId());

        log.info("Веха клиентского портала создана: '{}', project={}", request.title(), request.projectId());
        return ClientMilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public ClientMilestoneResponse updateMilestone(UUID id, UpdateMilestoneRequest request) {
        ClientMilestone milestone = milestoneRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Веха не найдена: " + id));

        if (request.title() != null) {
            milestone.setTitle(request.title());
        }
        if (request.description() != null) {
            milestone.setDescription(request.description());
        }
        if (request.targetDate() != null) {
            milestone.setTargetDate(request.targetDate());
        }
        if (request.actualDate() != null) {
            milestone.setActualDate(request.actualDate());
        }
        if (request.status() != null) {
            String oldStatus = milestone.getStatus().name();
            milestone.setStatus(request.status());
            auditService.logStatusChange("ClientMilestone", id, oldStatus, request.status().name());
        }
        if (request.sortOrder() != null) {
            milestone.setSortOrder(request.sortOrder());
        }
        if (request.visibleToClient() != null) {
            milestone.setVisibleToClient(request.visibleToClient());
        }

        milestone = milestoneRepository.save(milestone);
        auditService.logUpdate("ClientMilestone", id, "milestone", null, null);

        log.info("Веха клиентского портала обновлена: {} ({})", milestone.getTitle(), id);
        return ClientMilestoneResponse.fromEntity(milestone);
    }

    @Transactional(readOnly = true)
    public Page<ClientMilestoneResponse> getVisibleMilestones(UUID projectId, Pageable pageable) {
        return milestoneRepository.findByProjectIdAndVisibleToClientTrueAndDeletedFalse(projectId, pageable)
                .map(ClientMilestoneResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ClientMilestoneResponse> getAllMilestones(UUID projectId, Pageable pageable) {
        return milestoneRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ClientMilestoneResponse::fromEntity);
    }

    // ============================================================
    // Client Dashboard
    // ============================================================

    @Transactional(readOnly = true)
    public ClientDashboardResponse getClientDashboard(UUID portalUserId, UUID projectId) {
        // Resolve project: either from param or first portal project for the user
        final UUID resolvedProjectId;
        if (projectId != null) {
            resolvedProjectId = projectId;
        } else {
            List<PortalProject> portalProjects = portalProjectRepository
                    .findByPortalUserIdAndDeletedFalse(portalUserId);
            if (portalProjects.isEmpty()) {
                throw new EntityNotFoundException(
                        "Нет доступных проектов для портального пользователя: " + portalUserId);
            }
            resolvedProjectId = portalProjects.get(0).getProjectId();
        }

        // Project name
        Project project = projectRepository.findById(resolvedProjectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + resolvedProjectId));
        String projectName = project.getName();

        // Overall progress from latest published snapshot
        BigDecimal overallPercent = snapshotRepository
                .findLatestPublishedByProjectId(resolvedProjectId)
                .map(ClientProgressSnapshot::getOverallPercent)
                .orElse(BigDecimal.ZERO);

        // Latest milestones
        List<ClientMilestone> milestones = milestoneRepository
                .findByProjectIdAndVisibleToClientTrueAndDeletedFalseOrderBySortOrderAsc(resolvedProjectId);
        List<ClientMilestoneResponse> latestMilestones = milestones.stream()
                .limit(5)
                .map(ClientMilestoneResponse::fromEntity)
                .toList();

        // Pending signatures count
        long pendingSignatures = signatureRepository
                .countByPortalUserIdAndSignatureStatusAndDeletedFalse(portalUserId, SignatureStatus.PENDING);

        // Recent photos from latest published snapshot
        List<String> recentPhotos = Collections.emptyList();
        snapshotRepository.findLatestPublishedByProjectId(resolvedProjectId)
                .ifPresent(snap -> {
                    // photoReportJson is stored as JSON array; return raw for client parsing
                });
        // We pass the raw JSON; frontend can parse it
        String photoJson = snapshotRepository.findLatestPublishedByProjectId(resolvedProjectId)
                .map(ClientProgressSnapshot::getPhotoReportJson)
                .orElse(null);
        if (photoJson != null && !photoJson.isBlank()) {
            recentPhotos = List.of(photoJson);
        }

        // Financial summary
        BigDecimal totalContract = project.getContractAmount() != null
                ? project.getContractAmount() : BigDecimal.ZERO;
        BigDecimal totalInvoiced = invoiceRepository
                .sumTotalByProjectIdAndType(resolvedProjectId, InvoiceType.ISSUED);
        BigDecimal totalPaid = paymentRepository
                .sumTotalByProjectIdAndType(resolvedProjectId, PaymentType.INCOMING);

        ClientDashboardResponse.FinancialSummary financialSummary =
                new ClientDashboardResponse.FinancialSummary(totalContract, totalInvoiced, totalPaid);

        return new ClientDashboardResponse(
                projectName,
                overallPercent,
                latestMilestones,
                pendingSignatures,
                recentPhotos,
                financialSummary
        );
    }

    // ---- Internal helpers ----

    private ClientDocumentSignature getSignatureOrThrow(UUID id) {
        return signatureRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запрос на подписание не найден: " + id));
    }
}
