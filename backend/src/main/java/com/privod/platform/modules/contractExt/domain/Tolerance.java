package com.privod.platform.modules.contractExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tolerances", indexes = {
        @Index(name = "idx_tolerance_project", columnList = "project_id"),
        @Index(name = "idx_tolerance_work_type", columnList = "work_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tolerance extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "work_type", nullable = false, length = 200)
    private String workType;

    @Column(name = "parameter", nullable = false, length = 200)
    private String parameter;

    @Column(name = "nominal_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal nominalValue;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "min_deviation", nullable = false, precision = 18, scale = 4)
    private BigDecimal minDeviation;

    @Column(name = "max_deviation", nullable = false, precision = 18, scale = 4)
    private BigDecimal maxDeviation;

    @Column(name = "measurement_method", length = 200)
    private String measurementMethod;

    @Column(name = "reference_standard", length = 200)
    private String referenceStandard;
}
