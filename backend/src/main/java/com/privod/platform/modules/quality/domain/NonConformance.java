package com.privod.platform.modules.quality.domain;

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
@Table(name = "non_conformances", indexes = {
        @Index(name = "idx_nc_code", columnList = "code", unique = true),
        @Index(name = "idx_nc_quality_check", columnList = "quality_check_id"),
        @Index(name = "idx_nc_project", columnList = "project_id"),
        @Index(name = "idx_nc_status", columnList = "status"),
        @Index(name = "idx_nc_severity", columnList = "severity"),
        @Index(name = "idx_nc_due_date", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NonConformance extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(name = "quality_check_id")
    private UUID qualityCheckId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private NonConformanceSeverity severity;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "corrective_action", columnDefinition = "TEXT")
    private String correctiveAction;

    @Column(name = "preventive_action", columnDefinition = "TEXT")
    private String preventiveAction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private NonConformanceStatus status = NonConformanceStatus.OPEN;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;
}
