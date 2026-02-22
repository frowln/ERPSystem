package com.privod.platform.modules.safety.domain;

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
import java.util.UUID;

@Entity
@Table(name = "safety_risk_reports", indexes = {
        @Index(name = "idx_srr_org", columnList = "organization_id"),
        @Index(name = "idx_srr_week", columnList = "report_week")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyRiskReport extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "report_week", nullable = false, length = 20)
    private String reportWeek;

    @Column(name = "project_count", nullable = false)
    @Builder.Default
    private int projectCount = 0;

    @Column(name = "avg_risk_score", precision = 5, scale = 2)
    private BigDecimal avgRiskScore;

    @Column(name = "critical_projects")
    @Builder.Default
    private int criticalProjects = 0;

    @Column(name = "high_risk_projects")
    @Builder.Default
    private int highRiskProjects = 0;

    @Column(name = "top_recommendations_json", columnDefinition = "TEXT")
    private String topRecommendationsJson;

    @Column(name = "generated_at", nullable = false)
    @Builder.Default
    private Instant generatedAt = Instant.now();
}
