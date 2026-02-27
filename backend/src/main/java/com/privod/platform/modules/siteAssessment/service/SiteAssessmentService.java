package com.privod.platform.modules.siteAssessment.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.siteAssessment.domain.AssessmentStatus;
import com.privod.platform.modules.siteAssessment.domain.SiteAssessment;
import com.privod.platform.modules.siteAssessment.repository.SiteAssessmentRepository;
import com.privod.platform.modules.siteAssessment.web.dto.CreateSiteAssessmentRequest;
import com.privod.platform.modules.siteAssessment.web.dto.SiteAssessmentResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteAssessmentService {

    private final SiteAssessmentRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SiteAssessmentResponse> list(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Page<SiteAssessment> page = projectId != null
                ? repository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId, pageable)
                : repository.findByOrganizationIdAndDeletedFalse(orgId, pageable);
        return page.map(SiteAssessmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SiteAssessmentResponse getById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SiteAssessment sa = repository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обследование площадки не найдено: " + id));
        return SiteAssessmentResponse.fromEntity(sa);
    }

    @Transactional
    public SiteAssessmentResponse create(CreateSiteAssessmentRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        SiteAssessment sa = SiteAssessment.builder()
                .projectId(req.projectId())
                .organizationId(orgId)
                .assessmentDate(req.assessmentDate())
                .assessorName(req.assessorName())
                .siteAddress(req.siteAddress())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .accessRoads(req.accessRoads())
                .powerSupplyAvailable(req.powerSupplyAvailable())
                .waterSupplyAvailable(req.waterSupplyAvailable())
                .sewageAvailable(req.sewageAvailable())
                .groundConditionsOk(req.groundConditionsOk())
                .noEnvironmentalRestrictions(req.noEnvironmentalRestrictions())
                .cranePlacementPossible(req.cranePlacementPossible())
                .materialStorageArea(req.materialStorageArea())
                .workersCampArea(req.workersCampArea())
                .neighboringBuildingsSafe(req.neighboringBuildingsSafe())
                .zoningCompliant(req.zoningCompliant())
                .geodeticMarksPresent(req.geodeticMarksPresent())
                .groundType(req.groundType())
                .siteAreaSqm(req.siteAreaSqm())
                .maxBuildingHeightM(req.maxBuildingHeightM())
                .distanceToPowerM(req.distanceToPowerM())
                .distanceToWaterM(req.distanceToWaterM())
                .observations(req.observations())
                .risksIdentified(req.risksIdentified())
                .status(AssessmentStatus.DRAFT)
                .build();

        sa.calculateScore();
        sa = repository.save(sa);
        auditService.logCreate("SiteAssessment", sa.getId());
        log.info("Обследование площадки создано: {} для проекта {} (скоринг: {}/12 — {})",
                sa.getId(), req.projectId(), sa.getScore(), sa.getRecommendation());
        return SiteAssessmentResponse.fromEntity(sa);
    }

    @Transactional
    public SiteAssessmentResponse complete(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SiteAssessment sa = repository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обследование не найдено: " + id));
        sa.calculateScore();
        sa.setStatus(AssessmentStatus.COMPLETED);
        sa = repository.save(sa);
        auditService.logStatusChange("SiteAssessment", id, "DRAFT", "COMPLETED");
        log.info("Обследование площадки завершено: {} (скоринг: {}/12 — {})",
                id, sa.getScore(), sa.getRecommendation());
        return SiteAssessmentResponse.fromEntity(sa);
    }
}
