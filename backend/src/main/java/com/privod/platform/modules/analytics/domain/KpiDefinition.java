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

@Entity
@Table(name = "kpi_definitions", indexes = {
        @Index(name = "idx_kpi_code", columnList = "code", unique = true),
        @Index(name = "idx_kpi_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiDefinition extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private KpiCategory category;

    @Column(name = "data_source", length = 255)
    private String dataSource;

    @Enumerated(EnumType.STRING)
    @Column(name = "aggregation_type", nullable = false, length = 20)
    @Builder.Default
    private AggregationType aggregationType = AggregationType.COUNT;

    @Column(name = "formula", columnDefinition = "TEXT")
    private String formula;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 20)
    @Builder.Default
    private KpiUnit unit = KpiUnit.COUNT;

    @Column(name = "target_value", precision = 18, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "warning_threshold", precision = 18, scale = 4)
    private BigDecimal warningThreshold;

    @Column(name = "critical_threshold", precision = 18, scale = 4)
    private BigDecimal criticalThreshold;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
