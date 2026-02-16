package com.privod.platform.modules.analytics.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "abc_xyz_analyses", indexes = {
        @Index(name = "idx_abcxyz_project", columnList = "project_id"),
        @Index(name = "idx_abcxyz_date", columnList = "analysis_date"),
        @Index(name = "idx_abcxyz_entity_type", columnList = "entity_type"),
        @Index(name = "idx_abcxyz_abc_category", columnList = "abc_category"),
        @Index(name = "idx_abcxyz_xyz_category", columnList = "xyz_category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbcXyzAnalysis extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "analysis_date", nullable = false)
    private LocalDate analysisDate;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "entity_name", nullable = false, length = 500)
    private String entityName;

    @Enumerated(EnumType.STRING)
    @Column(name = "abc_category", nullable = false, length = 5)
    private AbcCategory abcCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "xyz_category", nullable = false, length = 5)
    private XyzCategory xyzCategory;

    @Column(name = "total_value", precision = 18, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "percent_of_total", precision = 8, scale = 4)
    private BigDecimal percentOfTotal;

    @Column(name = "variation_coefficient", precision = 8, scale = 4)
    private BigDecimal variationCoefficient;

    @Column(name = "frequency", nullable = false)
    @Builder.Default
    private int frequency = 0;
}
