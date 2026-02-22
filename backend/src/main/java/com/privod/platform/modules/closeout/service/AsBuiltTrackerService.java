package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.AsBuiltLinkStatus;
import com.privod.platform.modules.closeout.domain.AsBuiltRequirement;
import com.privod.platform.modules.closeout.domain.AsBuiltWbsLink;
import com.privod.platform.modules.closeout.repository.AsBuiltRequirementRepository;
import com.privod.platform.modules.closeout.repository.AsBuiltWbsLinkRepository;
import com.privod.platform.modules.closeout.web.dto.AsBuiltRequirementResponse;
import com.privod.platform.modules.closeout.web.dto.AsBuiltWbsLinkResponse;
import com.privod.platform.modules.closeout.web.dto.AsBuiltWbsProgressResponse;
import com.privod.platform.modules.closeout.web.dto.CreateAsBuiltRequirementRequest;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.pto.domain.WorkType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsBuiltTrackerService {

    private final AsBuiltRequirementRepository asBuiltRequirementRepository;
    private final AsBuiltWbsLinkRepository asBuiltWbsLinkRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final AuditService auditService;

    // --- Requirements CRUD ---

    @Transactional(readOnly = true)
    public Page<AsBuiltRequirementResponse> getRequirements(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return asBuiltRequirementRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, pageable)
                .map(AsBuiltRequirementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AsBuiltRequirementResponse> getOrgDefaults() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return asBuiltRequirementRepository
                .findByOrganizationIdAndProjectIdIsNullAndDeletedFalse(orgId)
                .stream().map(AsBuiltRequirementResponse::fromEntity).toList();
    }

    @Transactional
    public AsBuiltRequirementResponse createRequirement(CreateAsBuiltRequirementRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AsBuiltRequirement req = AsBuiltRequirement.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .workType(request.workType())
                .docCategory(request.docCategory())
                .description(request.description())
                .isRequired(request.isRequired())
                .build();
        req = asBuiltRequirementRepository.save(req);
        auditService.logCreate("AsBuiltRequirement", req.getId());
        return AsBuiltRequirementResponse.fromEntity(req);
    }

    @Transactional
    public void deleteRequirement(UUID id) {
        AsBuiltRequirement req = asBuiltRequirementRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Требование не найдено: " + id));
        req.softDelete();
        asBuiltRequirementRepository.save(req);
        auditService.logDelete("AsBuiltRequirement", id);
    }

    // --- WBS Links ---

    @Transactional(readOnly = true)
    public List<AsBuiltWbsLinkResponse> getLinksForWbs(UUID wbsNodeId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return asBuiltWbsLinkRepository.findByOrganizationIdAndWbsNodeIdAndDeletedFalse(orgId, wbsNodeId)
                .stream().map(AsBuiltWbsLinkResponse::fromEntity).toList();
    }

    @Transactional
    public AsBuiltWbsLinkResponse linkDocument(UUID wbsNodeId, UUID projectId, String docCategory, UUID documentContainerId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        AsBuiltWbsLink link = AsBuiltWbsLink.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .wbsNodeId(wbsNodeId)
                .docCategory(docCategory)
                .documentContainerId(documentContainerId)
                .status(AsBuiltLinkStatus.SUBMITTED)
                .build();
        link = asBuiltWbsLinkRepository.save(link);
        auditService.logCreate("AsBuiltWbsLink", link.getId());
        return AsBuiltWbsLinkResponse.fromEntity(link);
    }

    @Transactional
    public AsBuiltWbsLinkResponse updateLinkStatus(UUID linkId, AsBuiltLinkStatus newStatus) {
        AsBuiltWbsLink link = asBuiltWbsLinkRepository.findById(linkId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Связь не найдена: " + linkId));
        String oldStatus = link.getStatus().name();
        link.setStatus(newStatus);
        link = asBuiltWbsLinkRepository.save(link);
        auditService.logStatusChange("AsBuiltWbsLink", linkId, oldStatus, newStatus.name());
        return AsBuiltWbsLinkResponse.fromEntity(link);
    }

    @Transactional
    public void unlinkDocument(UUID linkId) {
        AsBuiltWbsLink link = asBuiltWbsLinkRepository.findById(linkId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Связь не найдена: " + linkId));
        link.softDelete();
        asBuiltWbsLinkRepository.save(link);
        auditService.logDelete("AsBuiltWbsLink", linkId);
    }

    // --- Progress / Dashboard ---

    @Transactional(readOnly = true)
    public List<AsBuiltWbsProgressResponse> getProjectProgress(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Load all WBS nodes for the project
        List<WbsNode> wbsNodes = wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);

        // Load all requirements for this project + org defaults
        List<AsBuiltRequirement> projectReqs = asBuiltRequirementRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, Pageable.unpaged()).getContent();
        List<AsBuiltRequirement> orgDefaults = asBuiltRequirementRepository
                .findByOrganizationIdAndProjectIdIsNullAndDeletedFalse(orgId);

        // Merge: project-specific overrides org defaults
        // Build map of workType -> set of required docCategories
        Map<WorkType, Set<String>> requirementsMap = new HashMap<>();
        for (AsBuiltRequirement req : orgDefaults) {
            if (req.isRequired()) {
                requirementsMap.computeIfAbsent(req.getWorkType(), k -> new HashSet<>()).add(req.getDocCategory());
            }
        }
        for (AsBuiltRequirement req : projectReqs) {
            if (req.isRequired()) {
                requirementsMap.computeIfAbsent(req.getWorkType(), k -> new HashSet<>()).add(req.getDocCategory());
            }
        }

        // Batch load all links for this project
        List<UUID> wbsIds = wbsNodes.stream().map(WbsNode::getId).toList();
        List<AsBuiltWbsLink> allLinks = wbsIds.isEmpty() ? List.of() :
                asBuiltWbsLinkRepository.findByOrganizationIdAndWbsNodeIdInAndDeletedFalse(orgId, wbsIds);

        // Group links by wbsNodeId
        Map<UUID, List<AsBuiltWbsLink>> linksByWbs = allLinks.stream()
                .collect(Collectors.groupingBy(AsBuiltWbsLink::getWbsNodeId));

        // Build progress per WBS node
        List<AsBuiltWbsProgressResponse> result = new ArrayList<>();

        for (WbsNode node : wbsNodes) {
            List<AsBuiltWbsLink> nodeLinks = linksByWbs.getOrDefault(node.getId(), List.of());
            List<AsBuiltWbsLinkResponse> linkResponses = nodeLinks.stream()
                    .map(AsBuiltWbsLinkResponse::fromEntity).toList();

            int totalRequired = nodeLinks.isEmpty() ? 0 : (int) nodeLinks.stream()
                    .map(AsBuiltWbsLink::getDocCategory).distinct().count();
            int submitted = (int) nodeLinks.stream()
                    .filter(l -> l.getStatus() != AsBuiltLinkStatus.PENDING).count();
            int accepted = (int) nodeLinks.stream()
                    .filter(l -> l.getStatus() == AsBuiltLinkStatus.ACCEPTED).count();
            double completionPercent = totalRequired > 0 ? (double) accepted / totalRequired * 100.0 : 0.0;
            boolean qualityGatePassed = totalRequired > 0 && accepted >= totalRequired;

            result.add(new AsBuiltWbsProgressResponse(
                    node.getId(),
                    node.getCode(),
                    node.getName(),
                    totalRequired,
                    submitted,
                    accepted,
                    Math.round(completionPercent * 100.0) / 100.0,
                    qualityGatePassed,
                    linkResponses
            ));
        }

        return result;
    }

    // --- Quality Gate check for single WBS node ---

    @Transactional(readOnly = true)
    public boolean checkQualityGate(UUID wbsNodeId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<AsBuiltWbsLink> links = asBuiltWbsLinkRepository
                .findByOrganizationIdAndWbsNodeIdAndDeletedFalse(orgId, wbsNodeId);
        if (links.isEmpty()) return true; // No requirements = pass
        return links.stream().allMatch(l -> l.getStatus() == AsBuiltLinkStatus.ACCEPTED);
    }
}
