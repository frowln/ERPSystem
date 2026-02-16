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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "quality_plans", indexes = {
        @Index(name = "idx_quality_plan_project", columnList = "project_id"),
        @Index(name = "idx_quality_plan_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityPlan extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "plan_version", nullable = false)
    @Builder.Default
    private Integer planVersion = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private QualityPlanStatus status = QualityPlanStatus.DRAFT;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sections", columnDefinition = "jsonb")
    private Map<String, Object> sections;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    public boolean canTransitionTo(QualityPlanStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
