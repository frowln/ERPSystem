package com.privod.platform.modules.planning.domain;

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
@Table(name = "resource_allocations", indexes = {
        @Index(name = "idx_res_alloc_wbs_node", columnList = "wbs_node_id"),
        @Index(name = "idx_res_alloc_resource", columnList = "resource_id"),
        @Index(name = "idx_res_alloc_type", columnList = "resource_type"),
        @Index(name = "idx_res_alloc_dates", columnList = "start_date, end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAllocation extends BaseEntity {

    @Column(name = "wbs_node_id", nullable = false)
    private UUID wbsNodeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 30)
    private ResourceType resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "resource_name", length = 500)
    private String resourceName;

    @Column(name = "planned_units", precision = 12, scale = 2)
    private BigDecimal plannedUnits;

    @Column(name = "actual_units", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal actualUnits = BigDecimal.ZERO;

    @Column(name = "unit_rate", precision = 12, scale = 2)
    private BigDecimal unitRate;

    @Column(name = "planned_cost", precision = 18, scale = 2)
    private BigDecimal plannedCost;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
