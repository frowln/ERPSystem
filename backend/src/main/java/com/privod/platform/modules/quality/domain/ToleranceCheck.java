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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tolerance_checks", indexes = {
        @Index(name = "idx_tc_rule", columnList = "tolerance_rule_id"),
        @Index(name = "idx_tc_project", columnList = "project_id"),
        @Index(name = "idx_tc_status", columnList = "status"),
        @Index(name = "idx_tc_within_tolerance", columnList = "is_within_tolerance"),
        @Index(name = "idx_tc_checked_at", columnList = "checked_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToleranceCheck extends BaseEntity {

    @Column(name = "tolerance_rule_id", nullable = false)
    private UUID toleranceRuleId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "measured_value", precision = 16, scale = 4)
    private BigDecimal measuredValue;

    @Column(name = "is_within_tolerance", nullable = false)
    @Builder.Default
    private boolean isWithinTolerance = false;

    @Column(name = "deviation", precision = 16, scale = 4)
    private BigDecimal deviation;

    @Column(name = "checked_by_id")
    private UUID checkedById;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ToleranceCheckStatus status = ToleranceCheckStatus.PASS;
}
