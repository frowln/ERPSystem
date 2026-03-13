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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "wbs_nodes", indexes = {
        @Index(name = "idx_wbs_node_project", columnList = "project_id"),
        @Index(name = "idx_wbs_node_parent", columnList = "parent_id"),
        @Index(name = "idx_wbs_node_type", columnList = "node_type"),
        @Index(name = "idx_wbs_node_responsible", columnList = "responsible_id"),
        @Index(name = "idx_wbs_node_dates", columnList = "planned_start_date, planned_end_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WbsNode extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "code", length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", nullable = false, length = 30)
    @Builder.Default
    private WbsNodeType nodeType = WbsNodeType.ACTIVITY;

    @Column(name = "level")
    private Integer level;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "percent_complete", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentComplete = BigDecimal.ZERO;

    @Column(name = "cost_code_id")
    private UUID costCodeId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "is_critical", nullable = false)
    @Builder.Default
    private Boolean isCritical = false;

    @Column(name = "total_float")
    private Integer totalFloat;

    @Column(name = "free_float")
    private Integer freeFloat;

    @Column(name = "early_start")
    private LocalDate earlyStart;

    @Column(name = "early_finish")
    private LocalDate earlyFinish;

    @Column(name = "late_start")
    private LocalDate lateStart;

    @Column(name = "late_finish")
    private LocalDate lateFinish;

    @Column(name = "planned_volume", precision = 18, scale = 4)
    private BigDecimal plannedVolume;

    @Column(name = "volume_unit_of_measure", length = 50)
    private String volumeUnitOfMeasure;
}
