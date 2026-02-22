package com.privod.platform.modules.quality.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.repository.DocumentRepository;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.planning.repository.WorkVolumeEntryRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.quality.domain.QualityGate;
import com.privod.platform.modules.quality.domain.QualityGateStatus;
import com.privod.platform.modules.quality.domain.QualityGateTemplate;
import com.privod.platform.modules.quality.repository.QualityCheckRepository;
import com.privod.platform.modules.quality.repository.QualityGateRepository;
import com.privod.platform.modules.quality.repository.QualityGateTemplateRepository;
import com.privod.platform.modules.quality.web.dto.ApplyTemplateRequest;
import com.privod.platform.modules.quality.web.dto.CreateQualityGateRequest;
import com.privod.platform.modules.quality.web.dto.ProgressionCheckResponse;
import com.privod.platform.modules.quality.web.dto.QualityGateResponse;
import com.privod.platform.modules.quality.web.dto.QualityGateTemplateResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityGateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QualityGateService {

    private final QualityGateRepository qualityGateRepository;
    private final QualityGateTemplateRepository qualityGateTemplateRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final DocumentRepository documentRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final WorkVolumeEntryRepository workVolumeEntryRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ========== Gate CRUD ==========

    @Transactional(readOnly = true)
    public List<QualityGateResponse> getGatesForProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        verifyProjectAccess(projectId, orgId);

        return qualityGateRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId)
                .stream()
                .map(QualityGateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public QualityGateResponse getGateDetail(UUID gateId) {
        QualityGate gate = getGateOrThrow(gateId);
        return QualityGateResponse.fromEntity(gate);
    }

    @Transactional
    public QualityGateResponse createGate(CreateQualityGateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        verifyProjectAccess(request.projectId(), orgId);

        QualityGate gate = QualityGate.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .wbsNodeId(request.wbsNodeId())
                .name(request.name())
                .description(request.description())
                .requiredDocumentsJson(request.requiredDocumentsJson())
                .requiredQualityChecksJson(request.requiredQualityChecksJson())
                .volumeThresholdPercent(request.volumeThresholdPercent())
                .status(QualityGateStatus.NOT_STARTED)
                .docCompletionPercent(0)
                .qualityCompletionPercent(0)
                .volumeCompletionPercent(0)
                .build();

        gate = qualityGateRepository.save(gate);
        auditService.logCreate("QualityGate", gate.getId());
        log.info("Quality gate created: {} ({}) for project {}", gate.getName(), gate.getId(), gate.getProjectId());

        return QualityGateResponse.fromEntity(gate);
    }

    @Transactional
    public QualityGateResponse updateGate(UUID id, UpdateQualityGateRequest request) {
        QualityGate gate = getGateOrThrow(id);

        if (request.name() != null) {
            gate.setName(request.name());
        }
        if (request.description() != null) {
            gate.setDescription(request.description());
        }
        if (request.wbsNodeId() != null) {
            gate.setWbsNodeId(request.wbsNodeId());
        }
        if (request.requiredDocumentsJson() != null) {
            gate.setRequiredDocumentsJson(request.requiredDocumentsJson());
        }
        if (request.requiredQualityChecksJson() != null) {
            gate.setRequiredQualityChecksJson(request.requiredQualityChecksJson());
        }
        if (request.volumeThresholdPercent() != null) {
            gate.setVolumeThresholdPercent(request.volumeThresholdPercent());
        }

        gate = qualityGateRepository.save(gate);
        auditService.logUpdate("QualityGate", gate.getId(), "multiple", null, null);
        log.info("Quality gate updated: {} ({})", gate.getName(), gate.getId());

        return QualityGateResponse.fromEntity(gate);
    }

    @Transactional
    public void deleteGate(UUID id) {
        QualityGate gate = getGateOrThrow(id);
        gate.softDelete();
        qualityGateRepository.save(gate);
        auditService.logDelete("QualityGate", gate.getId());
        log.info("Quality gate deleted: {} ({})", gate.getName(), gate.getId());
    }

    // ========== Evaluation ==========

    @Transactional
    public QualityGateResponse evaluateGate(UUID gateId) {
        QualityGate gate = getGateOrThrow(gateId);
        doEvaluate(gate);
        gate = qualityGateRepository.save(gate);
        log.info("Quality gate evaluated: {} ({}) -> status={}", gate.getName(), gate.getId(), gate.getStatus());
        return QualityGateResponse.fromEntity(gate);
    }

    @Transactional
    public List<QualityGateResponse> evaluateAllForProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        verifyProjectAccess(projectId, orgId);

        List<QualityGate> gates = qualityGateRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);
        List<QualityGateResponse> results = new ArrayList<>();

        for (QualityGate gate : gates) {
            doEvaluate(gate);
            qualityGateRepository.save(gate);
            results.add(QualityGateResponse.fromEntity(gate));
        }

        log.info("Evaluated {} quality gates for project {}", results.size(), projectId);
        return results;
    }

    // ========== Template ==========

    @Transactional(readOnly = true)
    public List<QualityGateTemplateResponse> listTemplates() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return qualityGateTemplateRepository.findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(orgId)
                .stream()
                .map(QualityGateTemplateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<QualityGateResponse> applyTemplate(ApplyTemplateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        verifyProjectAccess(request.projectId(), orgId);

        QualityGateTemplate template = qualityGateTemplateRepository.findByIdAndDeletedFalse(request.templateId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Шаблон quality gate не найден: " + request.templateId()));

        if (!template.getOrganizationId().equals(orgId)) {
            throw new AccessDeniedException("Нет доступа к шаблону");
        }

        // Find matching WBS nodes by level pattern
        List<WbsNode> wbsNodes = wbsNodeRepository
                .findByProjectIdAndDeletedFalseOrderBySortOrder(request.projectId());

        Integer targetLevel = parseLevelPattern(template.getWbsLevelPattern());

        List<WbsNode> matchingNodes;
        if (targetLevel != null) {
            matchingNodes = wbsNodes.stream()
                    .filter(n -> n.getLevel() != null && n.getLevel().equals(targetLevel))
                    .toList();
        } else {
            // If no level pattern, apply to all leaf nodes (nodes that are not parents)
            List<UUID> parentIds = wbsNodes.stream()
                    .filter(n -> n.getParentId() != null)
                    .map(WbsNode::getParentId)
                    .distinct()
                    .toList();
            matchingNodes = wbsNodes.stream()
                    .filter(n -> !parentIds.contains(n.getId()))
                    .toList();
        }

        List<QualityGateResponse> created = new ArrayList<>();
        for (WbsNode node : matchingNodes) {
            QualityGate gate = QualityGate.builder()
                    .organizationId(orgId)
                    .projectId(request.projectId())
                    .wbsNodeId(node.getId())
                    .name(template.getName() + " — " + node.getName())
                    .description(template.getDescription())
                    .requiredDocumentsJson(template.getRequiredDocumentsJson())
                    .requiredQualityChecksJson(template.getRequiredQualityChecksJson())
                    .volumeThresholdPercent(template.getVolumeThresholdPercent())
                    .status(QualityGateStatus.NOT_STARTED)
                    .docCompletionPercent(0)
                    .qualityCompletionPercent(0)
                    .volumeCompletionPercent(0)
                    .build();

            gate = qualityGateRepository.save(gate);
            auditService.logCreate("QualityGate", gate.getId());
            created.add(QualityGateResponse.fromEntity(gate));
        }

        log.info("Applied template {} to project {}, created {} gates",
                template.getName(), request.projectId(), created.size());
        return created;
    }

    // ========== Progression Check ==========

    @Transactional(readOnly = true)
    public ProgressionCheckResponse checkProgression(UUID wbsNodeId) {
        SecurityUtils.requireCurrentOrganizationId();

        List<QualityGate> gates = qualityGateRepository.findByWbsNodeIdAndDeletedFalse(wbsNodeId);

        if (gates.isEmpty()) {
            return new ProgressionCheckResponse(wbsNodeId, true, 0, 0, List.of());
        }

        int totalGates = gates.size();
        int passedGates = 0;
        List<String> blockingNames = new ArrayList<>();

        for (QualityGate gate : gates) {
            if (gate.getStatus() == QualityGateStatus.PASSED) {
                passedGates++;
            } else {
                blockingNames.add(gate.getName());
            }
        }

        boolean allowed = passedGates == totalGates;
        return new ProgressionCheckResponse(wbsNodeId, allowed, totalGates, passedGates, blockingNames);
    }

    // ========== Private Helpers ==========

    private void doEvaluate(QualityGate gate) {
        QualityGateStatus oldStatus = gate.getStatus();

        int docPercent = calculateDocCompletion(gate);
        int qualityPercent = calculateQualityCompletion(gate);
        int volumePercent = calculateVolumeCompletion(gate);

        gate.setDocCompletionPercent(docPercent);
        gate.setQualityCompletionPercent(qualityPercent);
        gate.setVolumeCompletionPercent(volumePercent);

        // Determine new status
        List<String> reasons = new ArrayList<>();

        List<String> requiredDocs = parseJsonList(gate.getRequiredDocumentsJson());
        List<String> requiredChecks = parseJsonList(gate.getRequiredQualityChecksJson());

        boolean hasDocRequirement = !requiredDocs.isEmpty();
        boolean hasQcRequirement = !requiredChecks.isEmpty();
        boolean hasVolumeRequirement = gate.getVolumeThresholdPercent() != null
                && gate.getVolumeThresholdPercent() > 0;

        boolean docMet = !hasDocRequirement || docPercent >= 100;
        boolean qcMet = !hasQcRequirement || qualityPercent >= 100;
        boolean volumeMet = !hasVolumeRequirement || volumePercent >= gate.getVolumeThresholdPercent();

        if (!docMet) {
            reasons.add("Документация: " + docPercent + "% (требуется 100%)");
        }
        if (!qcMet) {
            reasons.add("Проверки качества: " + qualityPercent + "% (требуется 100%)");
        }
        if (!hasVolumeRequirement) {
            // no volume requirement, skip
        } else if (!volumeMet) {
            reasons.add("Объём работ: " + volumePercent + "% (требуется " + gate.getVolumeThresholdPercent() + "%)");
        }

        if (docMet && qcMet && volumeMet) {
            if (!hasDocRequirement && !hasQcRequirement && !hasVolumeRequirement) {
                // No requirements configured — keep NOT_STARTED
                gate.setStatus(QualityGateStatus.NOT_STARTED);
                gate.setBlockedReason(null);
            } else {
                gate.setStatus(QualityGateStatus.PASSED);
                gate.setBlockedReason(null);
                if (oldStatus != QualityGateStatus.PASSED) {
                    gate.setPassedAt(Instant.now());
                    gate.setPassedBy(SecurityUtils.requireCurrentUserId());
                    auditService.logStatusChange("QualityGate", gate.getId(),
                            oldStatus.name(), QualityGateStatus.PASSED.name());
                }
            }
        } else {
            gate.setBlockedReason(String.join("; ", reasons));
            gate.setPassedAt(null);
            gate.setPassedBy(null);

            // Determine if BLOCKED (was in progress or had some progress) or IN_PROGRESS
            boolean anyProgress = docPercent > 0 || qualityPercent > 0 || volumePercent > 0;
            if (anyProgress) {
                gate.setStatus(QualityGateStatus.BLOCKED);
            } else {
                gate.setStatus(QualityGateStatus.IN_PROGRESS);
            }

            if (oldStatus != gate.getStatus()) {
                auditService.logStatusChange("QualityGate", gate.getId(),
                        oldStatus.name(), gate.getStatus().name());
            }
        }
    }

    private int calculateDocCompletion(QualityGate gate) {
        List<String> requiredDocTypes = parseJsonList(gate.getRequiredDocumentsJson());
        if (requiredDocTypes.isEmpty()) {
            return 0;
        }

        UUID orgId = gate.getOrganizationId();
        UUID projectId = gate.getProjectId();

        // Get all non-deleted documents for this project
        List<Document> projectDocs = documentRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, Pageable.unpaged())
                .getContent();

        int matched = 0;
        for (String requiredType : requiredDocTypes) {
            boolean found = projectDocs.stream()
                    .anyMatch(doc -> doc.getCategory() != null
                            && doc.getCategory().name().equalsIgnoreCase(requiredType));
            if (found) {
                matched++;
            }
        }

        return (int) Math.round((double) matched / requiredDocTypes.size() * 100);
    }

    private int calculateQualityCompletion(QualityGate gate) {
        List<String> requiredCheckTypes = parseJsonList(gate.getRequiredQualityChecksJson());
        if (requiredCheckTypes.isEmpty()) {
            return 0;
        }

        // Find all passed quality checks for the WBS node
        List<QualityCheck> checks = qualityCheckRepository
                .findByWbsNodeIdAndDeletedFalse(gate.getWbsNodeId());

        int matched = 0;
        for (String requiredType : requiredCheckTypes) {
            boolean found = checks.stream()
                    .anyMatch(qc -> qc.getCheckType() != null
                            && qc.getCheckType().name().equalsIgnoreCase(requiredType)
                            && qc.getResult() == CheckResult.PASS);
            if (found) {
                matched++;
            }
        }

        return (int) Math.round((double) matched / requiredCheckTypes.size() * 100);
    }

    private int calculateVolumeCompletion(QualityGate gate) {
        if (gate.getVolumeThresholdPercent() == null || gate.getVolumeThresholdPercent() <= 0) {
            return 0;
        }

        // Get WBS node to find planned volume
        WbsNode node = wbsNodeRepository.findById(gate.getWbsNodeId())
                .filter(n -> !n.isDeleted())
                .orElse(null);

        if (node == null || node.getPlannedVolume() == null
                || node.getPlannedVolume().compareTo(BigDecimal.ZERO) <= 0) {
            // Fall back to percentComplete from the WBS node itself
            if (node != null && node.getPercentComplete() != null) {
                return node.getPercentComplete().intValue();
            }
            return 0;
        }

        // Sum actual volume from work volume entries
        BigDecimal actualVolume = workVolumeEntryRepository.sumQuantityByWbsNodeId(gate.getWbsNodeId());
        if (actualVolume == null || actualVolume.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        BigDecimal percent = actualVolume
                .multiply(BigDecimal.valueOf(100))
                .divide(node.getPlannedVolume(), 0, RoundingMode.HALF_UP);

        return Math.min(percent.intValue(), 100);
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON list: {}", json, e);
            return Collections.emptyList();
        }
    }

    private Integer parseLevelPattern(String pattern) {
        if (pattern == null || pattern.isBlank()) {
            return null;
        }
        // Expected format: "LEVEL_3" -> 3
        String trimmed = pattern.trim().toUpperCase();
        if (trimmed.startsWith("LEVEL_")) {
            try {
                return Integer.parseInt(trimmed.substring(6));
            } catch (NumberFormatException e) {
                log.warn("Invalid WBS level pattern: {}", pattern);
                return null;
            }
        }
        // Try parsing as plain number
        try {
            return Integer.parseInt(trimmed);
        } catch (NumberFormatException e) {
            log.warn("Invalid WBS level pattern: {}", pattern);
            return null;
        }
    }

    private QualityGate getGateOrThrow(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        QualityGate gate = qualityGateRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Quality gate не найден: " + id));
        if (!gate.getOrganizationId().equals(orgId)) {
            throw new EntityNotFoundException("Quality gate не найден: " + id);
        }
        return gate;
    }

    private void verifyProjectAccess(UUID projectId, UUID orgId) {
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new AccessDeniedException("Проект не найден или нет доступа"));
    }
}
