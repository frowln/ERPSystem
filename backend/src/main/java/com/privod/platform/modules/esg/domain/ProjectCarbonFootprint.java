package com.privod.platform.modules.esg.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_carbon_footprints", indexes = {
        @Index(name = "idx_pcf_org", columnList = "organization_id"),
        @Index(name = "idx_pcf_project", columnList = "project_id"),
        @Index(name = "idx_pcf_calculated", columnList = "calculated_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCarbonFootprint extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "total_embodied_carbon", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalEmbodiedCarbon = BigDecimal.ZERO;

    @Column(name = "material_breakdown_json", columnDefinition = "TEXT")
    private String materialBreakdownJson;

    @Column(name = "total_energy_kwh", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalEnergyKwh = BigDecimal.ZERO;

    @Column(name = "energy_source_breakdown_json", columnDefinition = "TEXT")
    private String energySourceBreakdownJson;

    @Column(name = "total_waste_tons", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal totalWasteTons = BigDecimal.ZERO;

    @Column(name = "waste_diverted_tons", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal wasteDivertedTons = BigDecimal.ZERO;

    @Column(name = "waste_diversion_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal wasteDiversionRate = BigDecimal.ZERO;

    @Column(name = "waste_breakdown_json", columnDefinition = "TEXT")
    private String wasteBreakdownJson;

    @Column(name = "total_water_m3", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalWaterM3 = BigDecimal.ZERO;

    @Column(name = "total_carbon_footprint", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCarbonFootprint = BigDecimal.ZERO;

    @Column(name = "carbon_per_sqm", precision = 10, scale = 2)
    private BigDecimal carbonPerSqm;

    @Column(name = "built_area_sqm", precision = 15, scale = 2)
    private BigDecimal builtAreaSqm;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();

    @Column(name = "period_from")
    private LocalDate periodFrom;

    @Column(name = "period_to")
    private LocalDate periodTo;
}
