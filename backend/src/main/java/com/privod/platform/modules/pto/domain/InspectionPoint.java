package com.privod.platform.modules.pto.domain;

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

import java.util.UUID;

@Entity
@Table(name = "inspection_points", indexes = {
        @Index(name = "idx_insp_point_plan", columnList = "quality_plan_id"),
        @Index(name = "idx_insp_point_type", columnList = "inspection_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionPoint extends BaseEntity {

    @Column(name = "quality_plan_id", nullable = false)
    private UUID qualityPlanId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "work_stage", nullable = false, length = 100)
    private String workStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 30)
    private InspectionType inspectionType;

    @Column(name = "criteria", columnDefinition = "TEXT")
    private String criteria;

    @Column(name = "responsible_role", length = 100)
    private String responsibleRole;
}
