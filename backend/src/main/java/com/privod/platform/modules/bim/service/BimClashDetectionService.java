package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.bim.domain.BimClashResult;
import com.privod.platform.modules.bim.domain.BimClashTest;
import com.privod.platform.modules.bim.domain.BimElementMetadata;
import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.BimViewerSession;
import com.privod.platform.modules.bim.domain.ClashResultStatus;
import com.privod.platform.modules.bim.domain.ClashTestStatus;
import com.privod.platform.modules.bim.domain.ClashType;
import com.privod.platform.modules.bim.repository.BimClashResultRepository;
import com.privod.platform.modules.bim.repository.BimClashTestRepository;
import com.privod.platform.modules.bim.repository.BimElementMetadataRepository;
import com.privod.platform.modules.bim.repository.BimModelRepository;
import com.privod.platform.modules.bim.repository.BimViewerSessionRepository;
import com.privod.platform.modules.bim.web.dto.ClashResultResponse;
import com.privod.platform.modules.bim.web.dto.ClashSummaryResponse;
import com.privod.platform.modules.bim.web.dto.ClashTestResponse;
import com.privod.platform.modules.bim.web.dto.CreateClashTestRequest;
import com.privod.platform.modules.bim.web.dto.ElementMetadataRequest;
import com.privod.platform.modules.bim.web.dto.StartViewerSessionRequest;
import com.privod.platform.modules.bim.web.dto.ViewerSessionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BimClashDetectionService {

    private final BimClashTestRepository clashTestRepository;
    private final BimClashResultRepository clashResultRepository;
    private final BimViewerSessionRepository viewerSessionRepository;
    private final BimElementMetadataRepository elementMetadataRepository;
    private final BimModelRepository bimModelRepository;
    private final AuditService auditService;

    // ─── Clash Tests ─────────────────────────────────────────────────────────

    @Transactional
    public ClashTestResponse createClashTest(CreateClashTestRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Validate both models exist
        bimModelRepository.findById(request.modelAId())
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель A не найдена: " + request.modelAId()));
        bimModelRepository.findById(request.modelBId())
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель B не найдена: " + request.modelBId()));

        BimClashTest test = BimClashTest.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .modelAId(request.modelAId())
                .modelBId(request.modelBId())
                .toleranceMm(request.toleranceMm() != null ? request.toleranceMm() : 0.0)
                .status(ClashTestStatus.PENDING)
                .totalClashesFound(0)
                .build();

        test = clashTestRepository.save(test);
        auditService.logCreate("BimClashTest", test.getId());

        log.info("Clash test created: {} ({})", test.getName(), test.getId());
        return ClashTestResponse.fromEntity(test);
    }

    @Transactional(readOnly = true)
    public ClashTestResponse getClashTest(UUID clashTestId) {
        BimClashTest test = getClashTestOrThrow(clashTestId);
        return ClashTestResponse.fromEntity(test);
    }

    @Transactional(readOnly = true)
    public Page<ClashTestResponse> listClashTests(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return clashTestRepository
                    .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, pageable)
                    .map(ClashTestResponse::fromEntity);
        }
        return clashTestRepository
                .findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(ClashTestResponse::fromEntity);
    }

    @Transactional
    public ClashTestResponse runClashTest(UUID clashTestId) {
        BimClashTest test = getClashTestOrThrow(clashTestId);
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (test.getStatus() != ClashTestStatus.PENDING && test.getStatus() != ClashTestStatus.FAILED) {
            throw new IllegalStateException(
                    String.format("Невозможно запустить тест из статуса '%s'", test.getStatus().getDisplayName()));
        }

        ClashTestStatus oldStatus = test.getStatus();
        test.setStatus(ClashTestStatus.RUNNING);
        test.setStartedAt(Instant.now());
        test = clashTestRepository.save(test);
        auditService.logStatusChange("BimClashTest", test.getId(), oldStatus.name(), ClashTestStatus.RUNNING.name());

        // Simulate clash detection using element metadata from both models
        try {
            List<BimClashResult> generatedClashes = simulateClashDetection(test, orgId);

            test.setStatus(ClashTestStatus.COMPLETED);
            test.setCompletedAt(Instant.now());
            test.setTotalClashesFound(generatedClashes.size());
            test = clashTestRepository.save(test);
            auditService.logStatusChange("BimClashTest", test.getId(),
                    ClashTestStatus.RUNNING.name(), ClashTestStatus.COMPLETED.name());

            log.info("Clash test completed: {} — {} clashes found", test.getName(), generatedClashes.size());
        } catch (Exception e) {
            test.setStatus(ClashTestStatus.FAILED);
            test.setCompletedAt(Instant.now());
            test = clashTestRepository.save(test);
            auditService.logStatusChange("BimClashTest", test.getId(),
                    ClashTestStatus.RUNNING.name(), ClashTestStatus.FAILED.name());

            log.error("Clash test failed: {} — {}", test.getName(), e.getMessage(), e);
            throw new RuntimeException("Ошибка при выполнении теста коллизий: " + e.getMessage(), e);
        }

        return ClashTestResponse.fromEntity(test);
    }

    @Transactional
    public void deleteClashTest(UUID clashTestId) {
        BimClashTest test = getClashTestOrThrow(clashTestId);
        test.softDelete();
        clashTestRepository.save(test);
        auditService.logDelete("BimClashTest", test.getId());
        log.info("Clash test deleted: {} ({})", test.getName(), test.getId());
    }

    // ─── Clash Results ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ClashResultResponse> getClashResults(UUID clashTestId, ClashResultStatus status,
                                                      ClashType clashType, Pageable pageable) {
        // Verify test exists
        getClashTestOrThrow(clashTestId);

        if (status != null) {
            return clashResultRepository
                    .findByClashTestIdAndStatusAndDeletedFalse(clashTestId, status, pageable)
                    .map(ClashResultResponse::fromEntity);
        }
        if (clashType != null) {
            return clashResultRepository
                    .findByClashTestIdAndClashTypeAndDeletedFalse(clashTestId, clashType, pageable)
                    .map(ClashResultResponse::fromEntity);
        }
        return clashResultRepository
                .findByClashTestIdAndDeletedFalse(clashTestId, pageable)
                .map(ClashResultResponse::fromEntity);
    }

    @Transactional
    public ClashResultResponse resolveClash(UUID clashResultId, String resolutionNotes) {
        BimClashResult result = getClashResultOrThrow(clashResultId);

        if (result.getStatus() == ClashResultStatus.RESOLVED) {
            throw new IllegalStateException("Коллизия уже решена");
        }

        ClashResultStatus oldStatus = result.getStatus();
        result.setStatus(ClashResultStatus.RESOLVED);
        result.setResolvedAt(Instant.now());
        result.setResolutionNotes(resolutionNotes);

        result = clashResultRepository.save(result);
        auditService.logStatusChange("BimClashResult", result.getId(),
                oldStatus.name(), ClashResultStatus.RESOLVED.name());

        log.info("Clash result resolved: {}", result.getId());
        return ClashResultResponse.fromEntity(result);
    }

    @Transactional
    public ClashResultResponse ignoreClash(UUID clashResultId, String resolutionNotes) {
        BimClashResult result = getClashResultOrThrow(clashResultId);

        if (result.getStatus() == ClashResultStatus.IGNORED) {
            throw new IllegalStateException("Коллизия уже игнорируется");
        }

        ClashResultStatus oldStatus = result.getStatus();
        result.setStatus(ClashResultStatus.IGNORED);
        result.setResolutionNotes(resolutionNotes);

        result = clashResultRepository.save(result);
        auditService.logStatusChange("BimClashResult", result.getId(),
                oldStatus.name(), ClashResultStatus.IGNORED.name());

        log.info("Clash result ignored: {}", result.getId());
        return ClashResultResponse.fromEntity(result);
    }

    @Transactional
    public ClashResultResponse assignClash(UUID clashResultId, UUID userId) {
        BimClashResult result = getClashResultOrThrow(clashResultId);

        UUID oldUserId = result.getAssignedToUserId();
        result.setAssignedToUserId(userId);

        if (result.getStatus() == ClashResultStatus.NEW) {
            result.setStatus(ClashResultStatus.ACTIVE);
            auditService.logStatusChange("BimClashResult", result.getId(),
                    ClashResultStatus.NEW.name(), ClashResultStatus.ACTIVE.name());
        }

        result = clashResultRepository.save(result);
        auditService.logUpdate("BimClashResult", result.getId(), "assignedToUserId",
                oldUserId != null ? oldUserId.toString() : null, userId.toString());

        log.info("Clash result assigned to user {}: {}", userId, result.getId());
        return ClashResultResponse.fromEntity(result);
    }

    // ─── Clash Summary ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClashSummaryResponse getClashSummary(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<BimClashTest> tests = clashTestRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId);

        List<ClashSummaryResponse.TestSummary> summaries = new ArrayList<>();
        for (BimClashTest test : tests) {
            long total = clashResultRepository.countByClashTestIdAndDeletedFalse(test.getId());
            long newCount = clashResultRepository
                    .countByClashTestIdAndStatusAndDeletedFalse(test.getId(), ClashResultStatus.NEW);
            long activeCount = clashResultRepository
                    .countByClashTestIdAndStatusAndDeletedFalse(test.getId(), ClashResultStatus.ACTIVE);
            long resolvedCount = clashResultRepository
                    .countByClashTestIdAndStatusAndDeletedFalse(test.getId(), ClashResultStatus.RESOLVED);
            long ignoredCount = clashResultRepository
                    .countByClashTestIdAndStatusAndDeletedFalse(test.getId(), ClashResultStatus.IGNORED);

            summaries.add(new ClashSummaryResponse.TestSummary(
                    test.getId(), test.getName(), total, activeCount, newCount, resolvedCount, ignoredCount));
        }

        return new ClashSummaryResponse(projectId, summaries);
    }

    // ─── Viewer Sessions ─────────────────────────────────────────────────────

    @Transactional
    public ViewerSessionResponse startViewerSession(StartViewerSessionRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        // Validate model exists
        bimModelRepository.findById(request.modelId())
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель не найдена: " + request.modelId()));

        BimViewerSession session = BimViewerSession.builder()
                .organizationId(orgId)
                .userId(userId)
                .modelId(request.modelId())
                .startedAt(Instant.now())
                .build();

        session = viewerSessionRepository.save(session);
        auditService.logCreate("BimViewerSession", session.getId());

        log.info("Viewer session started: user={}, model={}", userId, request.modelId());
        return ViewerSessionResponse.fromEntity(session);
    }

    @Transactional
    public ViewerSessionResponse endViewerSession(UUID sessionId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        BimViewerSession session = viewerSessionRepository
                .findByIdAndOrganizationIdAndDeletedFalse(sessionId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Сессия просмотра не найдена: " + sessionId));

        if (session.getEndedAt() != null) {
            throw new IllegalStateException("Сессия просмотра уже завершена");
        }

        session.setEndedAt(Instant.now());
        session = viewerSessionRepository.save(session);
        auditService.logUpdate("BimViewerSession", session.getId(), "endedAt", null, session.getEndedAt().toString());

        log.info("Viewer session ended: {}", sessionId);
        return ViewerSessionResponse.fromEntity(session);
    }

    // ─── Element Metadata ────────────────────────────────────────────────────

    @Transactional
    public int importElementMetadata(UUID modelId, List<ElementMetadataRequest> metadataList) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Validate model exists
        bimModelRepository.findById(modelId)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель не найдена: " + modelId));

        int imported = 0;
        for (ElementMetadataRequest req : metadataList) {
            // Upsert: update existing or create new
            BimElementMetadata metadata = elementMetadataRepository
                    .findByModelIdAndElementGuidAndDeletedFalse(modelId, req.elementGuid())
                    .orElse(BimElementMetadata.builder()
                            .organizationId(orgId)
                            .modelId(modelId)
                            .elementGuid(req.elementGuid())
                            .build());

            metadata.setElementName(req.elementName());
            metadata.setIfcType(req.ifcType());
            metadata.setFloorName(req.floorName());
            metadata.setSystemName(req.systemName());
            metadata.setPropertiesJson(req.propertiesJson());

            elementMetadataRepository.save(metadata);
            imported++;
        }

        auditService.logCreate("BimElementMetadata", modelId);
        log.info("Imported {} element metadata entries for model {}", imported, modelId);
        return imported;
    }

    @Transactional(readOnly = true)
    public Page<BimElementMetadata> getElementMetadata(UUID modelId, Pageable pageable) {
        return elementMetadataRepository.findByModelIdAndDeletedFalse(modelId, pageable);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private BimClashTest getClashTestOrThrow(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return clashTestRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Тест коллизий не найден: " + id));
    }

    private BimClashResult getClashResultOrThrow(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return clashResultRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Результат коллизии не найден: " + id));
    }

    /**
     * Simulates clash detection between elements of two models.
     * In production, this would delegate to an external IFC parsing/clash engine.
     * Here we generate sample clashes from element metadata when available,
     * or create synthetic results otherwise.
     */
    private List<BimClashResult> simulateClashDetection(BimClashTest test, UUID orgId) {
        List<BimElementMetadata> elementsA = elementMetadataRepository
                .findByModelIdAndDeletedFalse(test.getModelAId());
        List<BimElementMetadata> elementsB = elementMetadataRepository
                .findByModelIdAndDeletedFalse(test.getModelBId());

        List<BimClashResult> results = new ArrayList<>();
        Random random = new Random();
        ClashType[] clashTypes = ClashType.values();

        if (!elementsA.isEmpty() && !elementsB.isEmpty()) {
            // Generate clashes between actual metadata elements
            int maxClashes = Math.min(elementsA.size(), Math.min(elementsB.size(), 20));
            int clashCount = random.nextInt(maxClashes) + 1;

            for (int i = 0; i < clashCount; i++) {
                BimElementMetadata elA = elementsA.get(random.nextInt(elementsA.size()));
                BimElementMetadata elB = elementsB.get(random.nextInt(elementsB.size()));

                BimClashResult result = BimClashResult.builder()
                        .organizationId(orgId)
                        .clashTestId(test.getId())
                        .elementAGuid(elA.getElementGuid())
                        .elementAName(elA.getElementName())
                        .elementAType(elA.getIfcType())
                        .elementBGuid(elB.getElementGuid())
                        .elementBName(elB.getElementName())
                        .elementBType(elB.getIfcType())
                        .clashType(clashTypes[random.nextInt(clashTypes.length)])
                        .clashPointX(random.nextDouble() * 100)
                        .clashPointY(random.nextDouble() * 100)
                        .clashPointZ(random.nextDouble() * 30)
                        .distanceMm(random.nextDouble() * test.getToleranceMm() * 2)
                        .status(ClashResultStatus.NEW)
                        .build();

                results.add(clashResultRepository.save(result));
            }
        } else {
            // Generate synthetic clashes when no element metadata exists
            int syntheticCount = random.nextInt(10) + 3;

            for (int i = 0; i < syntheticCount; i++) {
                BimClashResult result = BimClashResult.builder()
                        .organizationId(orgId)
                        .clashTestId(test.getId())
                        .elementAGuid("ELEM-A-" + UUID.randomUUID().toString().substring(0, 8))
                        .elementAName("Элемент модели A #" + (i + 1))
                        .elementAType("IfcWall")
                        .elementBGuid("ELEM-B-" + UUID.randomUUID().toString().substring(0, 8))
                        .elementBName("Элемент модели B #" + (i + 1))
                        .elementBType("IfcPipeSegment")
                        .clashType(clashTypes[random.nextInt(clashTypes.length)])
                        .clashPointX(random.nextDouble() * 100)
                        .clashPointY(random.nextDouble() * 100)
                        .clashPointZ(random.nextDouble() * 30)
                        .distanceMm(random.nextDouble() * 50)
                        .status(ClashResultStatus.NEW)
                        .build();

                results.add(clashResultRepository.save(result));
            }
        }

        return results;
    }
}
