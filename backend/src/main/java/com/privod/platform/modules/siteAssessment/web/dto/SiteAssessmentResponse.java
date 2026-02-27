package com.privod.platform.modules.siteAssessment.web.dto;

import com.privod.platform.modules.siteAssessment.domain.SiteAssessment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SiteAssessmentResponse(
    UUID id,
    UUID projectId,
    LocalDate assessmentDate,
    String assessorName,
    String siteAddress,
    BigDecimal latitude,
    BigDecimal longitude,
    Boolean accessRoads,
    Boolean powerSupplyAvailable,
    Boolean waterSupplyAvailable,
    Boolean sewageAvailable,
    Boolean groundConditionsOk,
    Boolean noEnvironmentalRestrictions,
    Boolean cranePlacementPossible,
    Boolean materialStorageArea,
    Boolean workersCampArea,
    Boolean neighboringBuildingsSafe,
    Boolean zoningCompliant,
    Boolean geodeticMarksPresent,
    String groundType,
    BigDecimal siteAreaSqm,
    BigDecimal maxBuildingHeightM,
    BigDecimal distanceToPowerM,
    BigDecimal distanceToWaterM,
    String observations,
    String risksIdentified,
    String recommendation,
    Integer score,
    String status,
    String createdAt
) {
    public static SiteAssessmentResponse fromEntity(SiteAssessment e) {
        return new SiteAssessmentResponse(
            e.getId(), e.getProjectId(), e.getAssessmentDate(), e.getAssessorName(),
            e.getSiteAddress(), e.getLatitude(), e.getLongitude(),
            e.getAccessRoads(), e.getPowerSupplyAvailable(), e.getWaterSupplyAvailable(),
            e.getSewageAvailable(), e.getGroundConditionsOk(), e.getNoEnvironmentalRestrictions(),
            e.getCranePlacementPossible(), e.getMaterialStorageArea(), e.getWorkersCampArea(),
            e.getNeighboringBuildingsSafe(), e.getZoningCompliant(), e.getGeodeticMarksPresent(),
            e.getGroundType(), e.getSiteAreaSqm(), e.getMaxBuildingHeightM(),
            e.getDistanceToPowerM(), e.getDistanceToWaterM(),
            e.getObservations(), e.getRisksIdentified(), e.getRecommendation(),
            e.getScore(), e.getStatus() != null ? e.getStatus().name() : "DRAFT",
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
