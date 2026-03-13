package com.privod.platform.modules.estimate.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "estimate_volume_calculations")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolumeCalculation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "work_type", nullable = false, length = 50)
    private String workType;

    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Column(name = "result", precision = 18, scale = 4)
    private BigDecimal result;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "linked_estimate_item_id")
    private UUID linkedEstimateItemId;
}
