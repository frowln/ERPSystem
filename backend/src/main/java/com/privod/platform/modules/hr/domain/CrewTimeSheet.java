package com.privod.platform.modules.hr.domain;

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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crew_time_sheets", indexes = {
        @Index(name = "idx_cts_crew", columnList = "crew_id"),
        @Index(name = "idx_cts_project", columnList = "project_id"),
        @Index(name = "idx_cts_status", columnList = "status"),
        @Index(name = "idx_cts_period", columnList = "period_start, period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrewTimeSheet extends BaseEntity {

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "total_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "total_overtime", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalOvertime = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CrewTimeSheetStatus status = CrewTimeSheetStatus.DRAFT;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
