package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.bim.domain.BimDefectView;
import com.privod.platform.modules.bim.domain.BimModel;
import com.privod.platform.modules.bim.domain.DefectBimLink;
import com.privod.platform.modules.bim.repository.BimDefectViewRepository;
import com.privod.platform.modules.bim.repository.BimModelRepository;
import com.privod.platform.modules.bim.repository.DefectBimLinkRepository;
import com.privod.platform.modules.bim.web.dto.BimDefectViewResponse;
import com.privod.platform.modules.bim.web.dto.CreateDefectBimLinkRequest;
import com.privod.platform.modules.bim.web.dto.CreateSavedViewRequest;
import com.privod.platform.modules.bim.web.dto.DefectBimLinkResponse;
import com.privod.platform.modules.bim.web.dto.DefectHeatmapResponse;
import com.privod.platform.modules.bim.web.dto.UpdateDefectBimLinkRequest;
import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BimDefectLinkService {

    private final DefectBimLinkRepository defectBimLinkRepository;
    private final BimDefectViewRepository bimDefectViewRepository;
    private final BimModelRepository bimModelRepository;
    private final DefectRepository defectRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    // ──────────────────── Link operations ────────────────────

    @Transactional
    public DefectBimLinkResponse linkDefectToElement(CreateDefectBimLinkRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        Defect defect = defectRepository.findById(request.defectId())
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Дефект не найден: " + request.defectId()));
        validateOrgAccess(defect.getOrganizationId(), orgId);

        BimModel model = bimModelRepository.findById(request.modelId())
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель не найдена: " + request.modelId()));
        validateProjectAccess(model.getProjectId(), orgId);

        DefectBimLink link = DefectBimLink.builder()
                .organizationId(orgId)
                .defectId(request.defectId())
                .modelId(request.modelId())
                .elementGuid(request.elementGuid())
                .elementName(request.elementName())
                .elementType(request.elementType())
                .floorName(request.floorName())
                .systemName(request.systemName())
                .pinX(request.pinX())
                .pinY(request.pinY())
                .pinZ(request.pinZ())
                .cameraPositionJson(request.cameraPositionJson())
                .screenshotUrl(request.screenshotUrl())
                .notes(request.notes())
                .linkedByUserId(userId)
                .linkedAt(Instant.now())
                .build();

        link = defectBimLinkRepository.save(link);
        auditService.logCreate("DefectBimLink", link.getId());

        log.info("Defect {} linked to BIM element {} in model {}", request.defectId(),
                request.elementGuid(), request.modelId());
        return DefectBimLinkResponse.fromEntity(link);
    }

    @Transactional
    public void unlinkDefect(UUID linkId) {
        DefectBimLink link = getLinkOrThrow(linkId);
        link.softDelete();
        defectBimLinkRepository.save(link);
        auditService.logDelete("DefectBimLink", link.getId());

        log.info("Defect-BIM link deleted: {}", linkId);
    }

    @Transactional
    public DefectBimLinkResponse updateLink(UUID linkId, UpdateDefectBimLinkRequest request) {
        DefectBimLink link = getLinkOrThrow(linkId);

        if (request.elementGuid() != null) {
            link.setElementGuid(request.elementGuid());
        }
        if (request.elementName() != null) {
            link.setElementName(request.elementName());
        }
        if (request.elementType() != null) {
            link.setElementType(request.elementType());
        }
        if (request.floorName() != null) {
            link.setFloorName(request.floorName());
        }
        if (request.systemName() != null) {
            link.setSystemName(request.systemName());
        }
        if (request.pinX() != null) {
            link.setPinX(request.pinX());
        }
        if (request.pinY() != null) {
            link.setPinY(request.pinY());
        }
        if (request.pinZ() != null) {
            link.setPinZ(request.pinZ());
        }
        if (request.cameraPositionJson() != null) {
            link.setCameraPositionJson(request.cameraPositionJson());
        }
        if (request.screenshotUrl() != null) {
            link.setScreenshotUrl(request.screenshotUrl());
        }
        if (request.notes() != null) {
            link.setNotes(request.notes());
        }

        link = defectBimLinkRepository.save(link);
        auditService.logUpdate("DefectBimLink", link.getId(), "multiple", null, null);

        log.info("Defect-BIM link updated: {}", linkId);
        return DefectBimLinkResponse.fromEntity(link);
    }

    // ──────────────────── Query operations ────────────────────

    @Transactional(readOnly = true)
    public List<DefectBimLinkResponse> getLinksForDefect(UUID defectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Defect defect = defectRepository.findById(defectId)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Дефект не найден: " + defectId));
        validateOrgAccess(defect.getOrganizationId(), orgId);

        return defectBimLinkRepository.findByDefectIdAndDeletedFalse(defectId)
                .stream()
                .map(DefectBimLinkResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DefectBimLinkResponse> getLinksForModel(UUID modelId, String floorName,
                                                         String systemName, String elementType,
                                                         Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BimModel model = bimModelRepository.findById(modelId)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("BIM модель не найдена: " + modelId));
        validateProjectAccess(model.getProjectId(), orgId);

        return defectBimLinkRepository.findByModelIdWithFilters(modelId, floorName, systemName,
                        elementType, pageable)
                .map(DefectBimLinkResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DefectBimLinkResponse> getLinksForProject(UUID projectId, String floorName,
                                                           String systemName, String elementType,
                                                           Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(projectId, orgId);

        return defectBimLinkRepository.findByProjectIdWithFilters(projectId, floorName, systemName,
                        elementType, pageable)
                .map(DefectBimLinkResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DefectBimLinkResponse> getDefectsByFloor(UUID projectId, String floorName) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(projectId, orgId);

        return defectBimLinkRepository.findByProjectIdAndFloorName(projectId, floorName)
                .stream()
                .map(DefectBimLinkResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DefectBimLinkResponse> getDefectsBySystem(UUID projectId, String systemName) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(projectId, orgId);

        return defectBimLinkRepository.findByProjectIdAndSystemName(projectId, systemName)
                .stream()
                .map(DefectBimLinkResponse::fromEntity)
                .toList();
    }

    // ──────────────────── Heatmap ────────────────────

    @Transactional(readOnly = true)
    public DefectHeatmapResponse getDefectHeatmap(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(projectId, orgId);

        List<DefectHeatmapResponse.FloorDefectCount> byFloor =
                defectBimLinkRepository.countByFloorForProject(projectId)
                        .stream()
                        .map(row -> new DefectHeatmapResponse.FloorDefectCount(
                                (String) row[0], ((Number) row[1]).longValue()))
                        .toList();

        List<DefectHeatmapResponse.SystemDefectCount> bySystem =
                defectBimLinkRepository.countBySystemForProject(projectId)
                        .stream()
                        .map(row -> new DefectHeatmapResponse.SystemDefectCount(
                                (String) row[0], ((Number) row[1]).longValue()))
                        .toList();

        List<DefectHeatmapResponse.ElementTypeDefectCount> byElementType =
                defectBimLinkRepository.countByElementTypeForProject(projectId)
                        .stream()
                        .map(row -> new DefectHeatmapResponse.ElementTypeDefectCount(
                                (String) row[0], ((Number) row[1]).longValue()))
                        .toList();

        long totalDefects = byFloor.stream().mapToLong(DefectHeatmapResponse.FloorDefectCount::count).sum();

        return new DefectHeatmapResponse(totalDefects, byFloor, bySystem, byElementType);
    }

    // ──────────────────── Saved views ────────────────────

    @Transactional
    public BimDefectViewResponse createSavedView(CreateSavedViewRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(request.projectId(), orgId);

        if (request.modelId() != null) {
            bimModelRepository.findById(request.modelId())
                    .filter(m -> !m.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "BIM модель не найдена: " + request.modelId()));
        }

        BimDefectView view = BimDefectView.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .modelId(request.modelId())
                .filterFloor(request.filterFloor())
                .filterSystem(request.filterSystem())
                .filterDefectStatus(request.filterDefectStatus())
                .cameraPresetJson(request.cameraPresetJson())
                .elementGuidsJson(request.elementGuidsJson())
                .isShared(request.isShared() != null ? request.isShared() : false)
                .build();

        view = bimDefectViewRepository.save(view);
        auditService.logCreate("BimDefectView", view.getId());

        log.info("Saved BIM defect view created: {} for project {}", view.getName(), request.projectId());
        return BimDefectViewResponse.fromEntity(view);
    }

    @Transactional(readOnly = true)
    public List<BimDefectViewResponse> getSavedViews(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectAccess(projectId, orgId);

        return bimDefectViewRepository.findByProjectIdAndDeletedFalse(projectId)
                .stream()
                .map(BimDefectViewResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteSavedView(UUID viewId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BimDefectView view = bimDefectViewRepository.findById(viewId)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Представление не найдено: " + viewId));
        validateOrgAccess(view.getOrganizationId(), orgId);

        view.softDelete();
        bimDefectViewRepository.save(view);
        auditService.logDelete("BimDefectView", view.getId());

        log.info("Saved BIM defect view deleted: {}", viewId);
    }

    // ──────────────────── Helpers ────────────────────

    private DefectBimLink getLinkOrThrow(UUID linkId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        DefectBimLink link = defectBimLinkRepository.findById(linkId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Связь дефект-BIM не найдена: " + linkId));
        validateOrgAccess(link.getOrganizationId(), orgId);
        return link;
    }

    private void validateProjectAccess(UUID projectId, UUID orgId) {
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new AccessDeniedException("Проект не найден или доступ запрещён"));
    }

    private void validateOrgAccess(UUID entityOrgId, UUID currentOrgId) {
        if (!entityOrgId.equals(currentOrgId)) {
            throw new AccessDeniedException("Доступ запрещён");
        }
    }
}
