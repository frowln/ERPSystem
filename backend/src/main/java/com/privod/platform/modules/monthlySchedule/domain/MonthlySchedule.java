package com.privod.platform.modules.monthlySchedule.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "monthly_schedules", indexes = {
        @Index(name = "idx_ms_project", columnList = "project_id"),
        @Index(name = "idx_ms_year_month", columnList = "year, month"),
        @Index(name = "idx_ms_status", columnList = "status"),
        @Index(name = "idx_ms_approved_by", columnList = "approved_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlySchedule extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MonthlyScheduleStatus status = MonthlyScheduleStatus.DRAFT;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;
}
