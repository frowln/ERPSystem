package com.privod.platform.modules.siteAssessment.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "site_assessments")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SiteAssessment extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;

    @Column(name = "assessor_name", nullable = false, length = 200)
    private String assessorName;

    @Column(name = "site_address", length = 500)
    private String siteAddress;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    // --- Чеклист (каждый пункт — boolean) ---

    @Column(name = "access_roads")
    @Builder.Default
    private Boolean accessRoads = false;

    @Column(name = "power_supply_available")
    @Builder.Default
    private Boolean powerSupplyAvailable = false;

    @Column(name = "water_supply_available")
    @Builder.Default
    private Boolean waterSupplyAvailable = false;

    @Column(name = "sewage_available")
    @Builder.Default
    private Boolean sewageAvailable = false;

    @Column(name = "ground_conditions_ok")
    @Builder.Default
    private Boolean groundConditionsOk = false;

    @Column(name = "no_environmental_restrictions")
    @Builder.Default
    private Boolean noEnvironmentalRestrictions = false;

    @Column(name = "crane_placement_possible")
    @Builder.Default
    private Boolean cranePlacementPossible = false;

    @Column(name = "material_storage_area")
    @Builder.Default
    private Boolean materialStorageArea = false;

    @Column(name = "workers_camp_area")
    @Builder.Default
    private Boolean workersCampArea = false;

    @Column(name = "neighboring_buildings_safe")
    @Builder.Default
    private Boolean neighboringBuildingsSafe = false;

    @Column(name = "zoning_compliant")
    @Builder.Default
    private Boolean zoningCompliant = false;

    @Column(name = "geodetic_marks_present")
    @Builder.Default
    private Boolean geodeticMarksPresent = false;

    // --- Свободные поля ---

    @Column(name = "ground_type", length = 100)
    private String groundType;

    @Column(name = "site_area_sqm", precision = 12, scale = 2)
    private BigDecimal siteAreaSqm;

    @Column(name = "max_building_height_m", precision = 8, scale = 2)
    private BigDecimal maxBuildingHeightM;

    @Column(name = "distance_to_power_m", precision = 8, scale = 1)
    private BigDecimal distanceToPowerM;

    @Column(name = "distance_to_water_m", precision = 8, scale = 1)
    private BigDecimal distanceToWaterM;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "risks_identified", columnDefinition = "TEXT")
    private String risksIdentified;

    @Column(name = "recommendation", length = 50)
    @Builder.Default
    private String recommendation = "CONDITIONAL";

    @Column(name = "score")
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    public int calculateScore() {
        int s = 0;
        if (Boolean.TRUE.equals(accessRoads)) s++;
        if (Boolean.TRUE.equals(powerSupplyAvailable)) s++;
        if (Boolean.TRUE.equals(waterSupplyAvailable)) s++;
        if (Boolean.TRUE.equals(sewageAvailable)) s++;
        if (Boolean.TRUE.equals(groundConditionsOk)) s++;
        if (Boolean.TRUE.equals(noEnvironmentalRestrictions)) s++;
        if (Boolean.TRUE.equals(cranePlacementPossible)) s++;
        if (Boolean.TRUE.equals(materialStorageArea)) s++;
        if (Boolean.TRUE.equals(workersCampArea)) s++;
        if (Boolean.TRUE.equals(neighboringBuildingsSafe)) s++;
        if (Boolean.TRUE.equals(zoningCompliant)) s++;
        if (Boolean.TRUE.equals(geodeticMarksPresent)) s++;
        this.score = s;

        if (s >= 10) this.recommendation = "GO";
        else if (s >= 6) this.recommendation = "CONDITIONAL";
        else this.recommendation = "NO_GO";

        return s;
    }
}
