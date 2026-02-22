package com.privod.platform.modules.closeout.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.DocumentCategory;
import com.privod.platform.modules.closeout.domain.PackageDocumentStatus;
import com.privod.platform.modules.closeout.domain.StroynadzorPackage;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageDocument;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageStatus;
import com.privod.platform.modules.closeout.repository.AsBuiltRequirementRepository;
import com.privod.platform.modules.closeout.repository.CommissioningChecklistRepository;
import com.privod.platform.modules.closeout.repository.StroynadzorPackageDocumentRepository;
import com.privod.platform.modules.closeout.repository.StroynadzorPackageRepository;
import com.privod.platform.modules.closeout.web.dto.CompletenessReportResponse;
import com.privod.platform.modules.closeout.web.dto.CreateStroynadzorPackageRequest;
import com.privod.platform.modules.closeout.web.dto.StroynadzorPackageDetailResponse;
import com.privod.platform.modules.closeout.web.dto.StroynadzorPackageDocumentResponse;
import com.privod.platform.modules.closeout.web.dto.StroynadzorPackageResponse;
import com.privod.platform.modules.closeout.domain.AsBuiltRequirement;
import com.privod.platform.modules.closeout.domain.CommissioningChecklist;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.pto.domain.HiddenWorkAct;
import com.privod.platform.modules.pto.repository.HiddenWorkActRepository;
import com.privod.platform.modules.quality.domain.QualityCertificate;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.quality.domain.QualityGate;
import com.privod.platform.modules.quality.domain.QualityGateStatus;
import com.privod.platform.modules.quality.repository.QualityCertificateRepository;
import com.privod.platform.modules.quality.repository.QualityCheckRepository;
import com.privod.platform.modules.quality.repository.QualityGateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class StroynadzorPackageService {

    private final StroynadzorPackageRepository packageRepository;
    private final StroynadzorPackageDocumentRepository packageDocumentRepository;
    private final HiddenWorkActRepository hiddenWorkActRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final QualityCertificateRepository qualityCertificateRepository;
    private final CommissioningChecklistRepository commissioningChecklistRepository;
    private final AsBuiltRequirementRepository asBuiltRequirementRepository;
    private final QualityGateRepository qualityGateRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ===== Section numbering per Russian construction documentation standards =====
    private static final Map<DocumentCategory, String> SECTION_NAMES = new LinkedHashMap<>();

    static {
        SECTION_NAMES.put(DocumentCategory.AOSR, "АОСР (Акты освидетельствования скрытых работ)");
        SECTION_NAMES.put(DocumentCategory.QUALITY_PROTOCOL, "Протоколы качества");
        SECTION_NAMES.put(DocumentCategory.CERTIFICATE, "Сертификаты и паспорта качества");
        SECTION_NAMES.put(DocumentCategory.COMMISSIONING, "Пусконаладочная документация");
        SECTION_NAMES.put(DocumentCategory.PERMIT, "Разрешительная документация");
        SECTION_NAMES.put(DocumentCategory.DRAWING, "Рабочие чертежи");
        SECTION_NAMES.put(DocumentCategory.AS_BUILT, "Исполнительная документация");
        SECTION_NAMES.put(DocumentCategory.GEODETIC, "Геодезическая документация");
        SECTION_NAMES.put(DocumentCategory.JOURNAL, "Журналы работ");
        SECTION_NAMES.put(DocumentCategory.TEST_REPORT, "Протоколы испытаний");
    }

    // ========== CRUD ==========

    @Transactional
    public StroynadzorPackageResponse createPackage(CreateStroynadzorPackageRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        verifyProjectAccess(request.projectId(), orgId);

        StroynadzorPackage pkg = StroynadzorPackage.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .wbsNodeId(request.wbsNodeId())
                .name(request.name())
                .notes(request.notes())
                .status(StroynadzorPackageStatus.DRAFT)
                .completenessPct(BigDecimal.ZERO)
                .totalDocuments(0)
                .missingDocuments(0)
                .build();

        pkg = packageRepository.save(pkg);
        auditService.logCreate("StroynadzorPackage", pkg.getId());
        log.info("Stroynadzor package created: {} ({}) for project {}", pkg.getName(), pkg.getId(), pkg.getProjectId());

        return StroynadzorPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public StroynadzorPackageDetailResponse generatePackage(UUID packageId) {
        StroynadzorPackage pkg = getPackageOrThrow(packageId);

        // 1. Set status = GENERATING
        String oldStatus = pkg.getStatus().name();
        pkg.setStatus(StroynadzorPackageStatus.GENERATING);
        pkg = packageRepository.save(pkg);

        try {
            // 2. Clear previous document records for re-generation
            List<StroynadzorPackageDocument> existingDocs =
                    packageDocumentRepository.findByPackageIdAndDeletedFalseOrderBySectionNumberAsc(packageId);
            for (StroynadzorPackageDocument doc : existingDocs) {
                doc.softDelete();
            }
            packageDocumentRepository.saveAll(existingDocs);

            // 3. Collect documents from various modules
            UUID projectId = pkg.getProjectId();
            UUID wbsNodeId = pkg.getWbsNodeId();

            // Determine WBS node IDs to filter (if wbsNodeId is set, get subtree)
            List<UUID> wbsNodeIds = null;
            if (wbsNodeId != null) {
                wbsNodeIds = collectWbsSubtreeIds(projectId, wbsNodeId);
            }

            List<StroynadzorPackageDocument> collectedDocs = new ArrayList<>();
            AtomicInteger sectionCounter = new AtomicInteger(1);

            // Раздел 1 — АОСР
            collectHiddenWorkActs(pkg, projectId, collectedDocs, sectionCounter);

            // Раздел 2 — Протоколы качества
            collectQualityChecks(pkg, projectId, wbsNodeIds, collectedDocs, sectionCounter);

            // Раздел 3 — Сертификаты
            collectQualityCertificates(pkg, collectedDocs, sectionCounter);

            // Раздел 4 — Пусконаладочная документация
            collectCommissioningChecklists(pkg, projectId, collectedDocs, sectionCounter);

            // Раздел 5 — Исполнительная документация (as-built requirements)
            collectAsBuiltRequirements(pkg, projectId, collectedDocs, sectionCounter);

            // 4. Identify missing documents from quality gates
            List<CompletenessReportResponse.MissingDocumentItem> missingItems =
                    identifyMissingDocuments(projectId, wbsNodeIds, collectedDocs);

            // Create MISSING doc records for tracking
            int missingSection = sectionCounter.get();
            for (CompletenessReportResponse.MissingDocumentItem item : missingItems) {
                StroynadzorPackageDocument missingDoc = StroynadzorPackageDocument.builder()
                        .packageId(packageId)
                        .documentCategory(item.category())
                        .documentType(item.documentType())
                        .documentId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                        .sectionNumber(String.valueOf(missingSection))
                        .status(PackageDocumentStatus.MISSING)
                        .notes(item.description())
                        .build();
                collectedDocs.add(missingDoc);
            }

            // 5. Save all document records
            packageDocumentRepository.saveAll(collectedDocs);

            // 6. Calculate completeness
            int presentDocs = (int) collectedDocs.stream()
                    .filter(d -> d.getStatus() == PackageDocumentStatus.INCLUDED)
                    .count();
            int missingCount = missingItems.size();
            int totalDocs = presentDocs + missingCount;

            BigDecimal completeness = totalDocs > 0
                    ? BigDecimal.valueOf(presentDocs)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalDocs), 2, RoundingMode.HALF_UP)
                    : BigDecimal.valueOf(100);

            // 7. Build TOC JSON
            String tocJson = buildTocJson(collectedDocs);

            // 8. Build missing documents JSON
            String missingJson = buildMissingDocumentsJson(missingItems);

            // 9. Update package
            pkg.setStatus(StroynadzorPackageStatus.READY);
            pkg.setCompletenessPct(completeness);
            pkg.setTotalDocuments(totalDocs);
            pkg.setMissingDocuments(missingCount);
            pkg.setMissingDocumentsJson(missingJson);
            pkg.setTocJson(tocJson);
            pkg.setGeneratedAt(Instant.now());
            pkg.setErrorMessage(null);
            pkg = packageRepository.save(pkg);

            auditService.logStatusChange("StroynadzorPackage", pkg.getId(), oldStatus, StroynadzorPackageStatus.READY.name());
            log.info("Stroynadzor package generated: {} ({}) — {}% complete, {} docs, {} missing",
                    pkg.getName(), pkg.getId(), completeness, totalDocs, missingCount);

            // 10. Build detail response
            List<StroynadzorPackageDocumentResponse> docResponses = collectedDocs.stream()
                    .map(StroynadzorPackageDocumentResponse::fromEntity)
                    .toList();

            return StroynadzorPackageDetailResponse.fromEntity(pkg, docResponses);

        } catch (Exception e) {
            log.error("Error generating stroynadzor package {}: {}", packageId, e.getMessage(), e);
            pkg.setStatus(StroynadzorPackageStatus.ERROR);
            pkg.setErrorMessage(e.getMessage());
            packageRepository.save(pkg);
            auditService.logStatusChange("StroynadzorPackage", pkg.getId(), oldStatus, StroynadzorPackageStatus.ERROR.name());
            throw new RuntimeException("Ошибка генерации пакета для стройнадзора: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public StroynadzorPackageDetailResponse getPackageDetail(UUID packageId) {
        StroynadzorPackage pkg = getPackageOrThrow(packageId);
        List<StroynadzorPackageDocument> docs =
                packageDocumentRepository.findByPackageIdAndDeletedFalseOrderBySectionNumberAsc(packageId);
        List<StroynadzorPackageDocumentResponse> docResponses = docs.stream()
                .map(StroynadzorPackageDocumentResponse::fromEntity)
                .toList();
        return StroynadzorPackageDetailResponse.fromEntity(pkg, docResponses);
    }

    @Transactional(readOnly = true)
    public CompletenessReportResponse getCompletenessReport(UUID packageId) {
        StroynadzorPackage pkg = getPackageOrThrow(packageId);

        List<StroynadzorPackageDocument> docs =
                packageDocumentRepository.findByPackageIdAndDeletedFalseOrderBySectionNumberAsc(packageId);

        int presentCount = (int) docs.stream()
                .filter(d -> d.getStatus() == PackageDocumentStatus.INCLUDED)
                .count();

        List<CompletenessReportResponse.MissingDocumentItem> missingItems = docs.stream()
                .filter(d -> d.getStatus() == PackageDocumentStatus.MISSING)
                .map(d -> new CompletenessReportResponse.MissingDocumentItem(
                        d.getDocumentCategory(),
                        d.getDocumentType(),
                        null,
                        d.getNotes()
                ))
                .toList();

        int totalRequired = presentCount + missingItems.size();

        return new CompletenessReportResponse(
                pkg.getCompletenessPct(),
                totalRequired,
                presentCount,
                missingItems.size(),
                missingItems
        );
    }

    @Transactional(readOnly = true)
    public Page<StroynadzorPackageResponse> listPackages(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return packageRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, pageable)
                    .map(StroynadzorPackageResponse::fromEntity);
        }
        return packageRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(StroynadzorPackageResponse::fromEntity);
    }

    @Transactional
    public StroynadzorPackageResponse markAsSent(UUID packageId, String sentTo) {
        StroynadzorPackage pkg = getPackageOrThrow(packageId);

        if (pkg.getStatus() != StroynadzorPackageStatus.READY) {
            throw new IllegalStateException("Пакет должен быть в статусе READY для отправки");
        }

        String oldStatus = pkg.getStatus().name();
        pkg.setStatus(StroynadzorPackageStatus.SENT);
        pkg.setSentAt(Instant.now());
        pkg.setSentTo(sentTo);
        pkg = packageRepository.save(pkg);

        auditService.logStatusChange("StroynadzorPackage", pkg.getId(), oldStatus, StroynadzorPackageStatus.SENT.name());
        log.info("Stroynadzor package sent: {} ({}) to {}", pkg.getName(), pkg.getId(), sentTo);

        return StroynadzorPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public void deletePackage(UUID packageId) {
        StroynadzorPackage pkg = getPackageOrThrow(packageId);
        pkg.softDelete();
        packageRepository.save(pkg);
        auditService.logDelete("StroynadzorPackage", pkg.getId());
        log.info("Stroynadzor package deleted: {} ({})", pkg.getName(), pkg.getId());
    }

    // ========== Document Collection Helpers ==========

    private void collectHiddenWorkActs(StroynadzorPackage pkg, UUID projectId,
                                       List<StroynadzorPackageDocument> docs, AtomicInteger sectionCounter) {
        int section = sectionCounter.getAndIncrement();
        Page<HiddenWorkAct> acts = hiddenWorkActRepository.findByProjectIdAndDeletedFalse(projectId, Pageable.unpaged());
        int docIndex = 1;
        for (HiddenWorkAct act : acts.getContent()) {
            StroynadzorPackageDocument doc = StroynadzorPackageDocument.builder()
                    .packageId(pkg.getId())
                    .documentCategory(DocumentCategory.AOSR)
                    .documentType("AOSR")
                    .documentId(act.getId())
                    .documentNumber(act.getActNumber())
                    .documentDate(act.getDate())
                    .sectionNumber(section + "." + docIndex)
                    .hasSignature(act.getSignedAt() != null)
                    .status(PackageDocumentStatus.INCLUDED)
                    .build();
            docs.add(doc);
            docIndex++;
        }
    }

    private void collectQualityChecks(StroynadzorPackage pkg, UUID projectId, List<UUID> wbsNodeIds,
                                      List<StroynadzorPackageDocument> docs, AtomicInteger sectionCounter) {
        int section = sectionCounter.getAndIncrement();
        List<QualityCheck> checks;
        if (wbsNodeIds != null && !wbsNodeIds.isEmpty()) {
            // Collect checks for specific WBS nodes
            checks = new ArrayList<>();
            for (UUID wbsId : wbsNodeIds) {
                checks.addAll(qualityCheckRepository.findByWbsNodeIdAndDeletedFalse(wbsId));
            }
        } else {
            checks = qualityCheckRepository.findByProjectIdAndDeletedFalse(projectId, Pageable.unpaged()).getContent();
        }

        int docIndex = 1;
        for (QualityCheck check : checks) {
            StroynadzorPackageDocument doc = StroynadzorPackageDocument.builder()
                    .packageId(pkg.getId())
                    .documentCategory(DocumentCategory.QUALITY_PROTOCOL)
                    .documentType(check.getCheckType() != null ? check.getCheckType().name() : "QUALITY_CHECK")
                    .documentId(check.getId())
                    .documentNumber(check.getCode())
                    .documentDate(check.getActualDate())
                    .sectionNumber(section + "." + docIndex)
                    .status(PackageDocumentStatus.INCLUDED)
                    .build();
            docs.add(doc);
            docIndex++;
        }
    }

    private void collectQualityCertificates(StroynadzorPackage pkg,
                                            List<StroynadzorPackageDocument> docs, AtomicInteger sectionCounter) {
        int section = sectionCounter.getAndIncrement();
        // Certificates are organization-scoped (no projectId), collect all for the org
        Page<QualityCertificate> certs = qualityCertificateRepository.findByDeletedFalse(Pageable.unpaged());
        int docIndex = 1;
        for (QualityCertificate cert : certs.getContent()) {
            StroynadzorPackageDocument doc = StroynadzorPackageDocument.builder()
                    .packageId(pkg.getId())
                    .documentCategory(DocumentCategory.CERTIFICATE)
                    .documentType(cert.getCertificateType() != null ? cert.getCertificateType().name() : "CERTIFICATE")
                    .documentId(cert.getId())
                    .documentNumber(cert.getCertificateNumber())
                    .documentDate(cert.getIssueDate())
                    .sectionNumber(section + "." + docIndex)
                    .hasSignature(cert.isVerified())
                    .status(PackageDocumentStatus.INCLUDED)
                    .build();
            docs.add(doc);
            docIndex++;
        }
    }

    private void collectCommissioningChecklists(StroynadzorPackage pkg, UUID projectId,
                                                List<StroynadzorPackageDocument> docs, AtomicInteger sectionCounter) {
        int section = sectionCounter.getAndIncrement();
        Page<CommissioningChecklist> checklists =
                commissioningChecklistRepository.findByProjectIdAndDeletedFalse(projectId, Pageable.unpaged());
        int docIndex = 1;
        for (CommissioningChecklist checklist : checklists.getContent()) {
            StroynadzorPackageDocument doc = StroynadzorPackageDocument.builder()
                    .packageId(pkg.getId())
                    .documentCategory(DocumentCategory.COMMISSIONING)
                    .documentType("COMMISSIONING_CHECKLIST")
                    .documentId(checklist.getId())
                    .documentNumber(null)
                    .documentDate(checklist.getInspectionDate())
                    .sectionNumber(section + "." + docIndex)
                    .hasSignature(checklist.getSignedOffAt() != null)
                    .status(PackageDocumentStatus.INCLUDED)
                    .build();
            docs.add(doc);
            docIndex++;
        }
    }

    private void collectAsBuiltRequirements(StroynadzorPackage pkg, UUID projectId,
                                            List<StroynadzorPackageDocument> docs, AtomicInteger sectionCounter) {
        int section = sectionCounter.getAndIncrement();
        UUID orgId = pkg.getOrganizationId();
        Page<AsBuiltRequirement> requirements =
                asBuiltRequirementRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, Pageable.unpaged());
        int docIndex = 1;
        for (AsBuiltRequirement req : requirements.getContent()) {
            if (req.isRequired()) {
                StroynadzorPackageDocument doc = StroynadzorPackageDocument.builder()
                        .packageId(pkg.getId())
                        .documentCategory(DocumentCategory.AS_BUILT)
                        .documentType(req.getDocCategory())
                        .documentId(req.getId())
                        .sectionNumber(section + "." + docIndex)
                        .status(PackageDocumentStatus.INCLUDED)
                        .notes(req.getDescription())
                        .build();
                docs.add(doc);
                docIndex++;
            }
        }
    }

    // ========== Missing Document Identification ==========

    private List<CompletenessReportResponse.MissingDocumentItem> identifyMissingDocuments(
            UUID projectId, List<UUID> wbsNodeIds,
            List<StroynadzorPackageDocument> collectedDocs) {

        List<CompletenessReportResponse.MissingDocumentItem> missingItems = new ArrayList<>();

        // Check quality gates for missing requirements
        List<QualityGate> gates = qualityGateRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);

        for (QualityGate gate : gates) {
            // Skip if wbs filtering is active and this gate is not in subtree
            if (wbsNodeIds != null && !wbsNodeIds.contains(gate.getWbsNodeId())) {
                continue;
            }

            if (gate.getStatus() != QualityGateStatus.PASSED) {
                // Gate not passed — check what's missing
                if (gate.getDocCompletionPercent() != null && gate.getDocCompletionPercent() < 100) {
                    missingItems.add(new CompletenessReportResponse.MissingDocumentItem(
                            DocumentCategory.AS_BUILT,
                            "QUALITY_GATE_DOCS",
                            gate.getName(),
                            "Документация Quality Gate не завершена: " + gate.getDocCompletionPercent() + "%"
                    ));
                }
                if (gate.getQualityCompletionPercent() != null && gate.getQualityCompletionPercent() < 100) {
                    missingItems.add(new CompletenessReportResponse.MissingDocumentItem(
                            DocumentCategory.QUALITY_PROTOCOL,
                            "QUALITY_GATE_CHECKS",
                            gate.getName(),
                            "Проверки качества Quality Gate не завершены: " + gate.getQualityCompletionPercent() + "%"
                    ));
                }
            }
        }

        // Check for AOSR without signatures
        long unsignedAosr = collectedDocs.stream()
                .filter(d -> d.getDocumentCategory() == DocumentCategory.AOSR && !d.isHasSignature())
                .count();
        if (unsignedAosr > 0) {
            missingItems.add(new CompletenessReportResponse.MissingDocumentItem(
                    DocumentCategory.AOSR,
                    "UNSIGNED_AOSR",
                    null,
                    "АОСР без подписи: " + unsignedAosr + " шт."
            ));
        }

        return missingItems;
    }

    // ========== TOC Builder ==========

    private String buildTocJson(List<StroynadzorPackageDocument> docs) {
        List<Map<String, Object>> tocEntries = new ArrayList<>();
        int sectionNum = 1;

        for (Map.Entry<DocumentCategory, String> entry : SECTION_NAMES.entrySet()) {
            DocumentCategory category = entry.getKey();
            String title = entry.getValue();

            long docCount = docs.stream()
                    .filter(d -> d.getDocumentCategory() == category
                            && d.getStatus() == PackageDocumentStatus.INCLUDED)
                    .count();

            if (docCount > 0) {
                Map<String, Object> tocEntry = new LinkedHashMap<>();
                tocEntry.put("sectionNumber", String.valueOf(sectionNum));
                tocEntry.put("title", "Раздел " + sectionNum + " — " + title);
                tocEntry.put("documentCount", docCount);
                tocEntries.add(tocEntry);
            }
            sectionNum++;
        }

        try {
            return objectMapper.writeValueAsString(tocEntries);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize TOC JSON", e);
            return "[]";
        }
    }

    private String buildMissingDocumentsJson(List<CompletenessReportResponse.MissingDocumentItem> missingItems) {
        try {
            List<Map<String, String>> items = missingItems.stream()
                    .map(item -> {
                        Map<String, String> map = new LinkedHashMap<>();
                        map.put("category", item.category().name());
                        map.put("documentType", item.documentType());
                        map.put("wbsNodeName", item.wbsNodeName());
                        map.put("description", item.description());
                        return map;
                    })
                    .toList();
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize missing documents JSON", e);
            return "[]";
        }
    }

    // ========== WBS Subtree ==========

    private List<UUID> collectWbsSubtreeIds(UUID projectId, UUID rootNodeId) {
        List<WbsNode> allNodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);
        List<UUID> subtreeIds = new ArrayList<>();
        subtreeIds.add(rootNodeId);

        // BFS to collect all descendants
        List<UUID> queue = new ArrayList<>();
        queue.add(rootNodeId);

        while (!queue.isEmpty()) {
            UUID currentId = queue.remove(0);
            for (WbsNode node : allNodes) {
                if (currentId.equals(node.getParentId()) && !subtreeIds.contains(node.getId())) {
                    subtreeIds.add(node.getId());
                    queue.add(node.getId());
                }
            }
        }

        return subtreeIds;
    }

    // ========== Helpers ==========

    private StroynadzorPackage getPackageOrThrow(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        StroynadzorPackage pkg = packageRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пакет стройнадзора не найден: " + id));
        if (!pkg.getOrganizationId().equals(orgId)) {
            throw new EntityNotFoundException("Пакет стройнадзора не найден: " + id);
        }
        return pkg;
    }

    private void verifyProjectAccess(UUID projectId, UUID orgId) {
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new AccessDeniedException("Проект не найден или нет доступа"));
    }
}
