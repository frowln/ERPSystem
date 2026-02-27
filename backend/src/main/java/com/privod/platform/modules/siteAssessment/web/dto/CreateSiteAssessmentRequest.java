package com.privod.platform.modules.siteAssessment.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateSiteAssessmentRequest(
    @NotNull UUID projectId,
    @NotNull LocalDate assessmentDate,
    @NotBlank String assessorName,
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
    String risksIdentified
) {}
