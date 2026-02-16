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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "schedule_baselines", indexes = {
        @Index(name = "idx_baseline_project", columnList = "project_id"),
        @Index(name = "idx_baseline_type", columnList = "baseline_type"),
        @Index(name = "idx_baseline_date", columnList = "baseline_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleBaseline extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "baseline_type", nullable = false, length = 30)
    @Builder.Default
    private BaselineType baselineType = BaselineType.ORIGINAL;

    @Column(name = "baseline_date", nullable = false)
    private LocalDate baselineDate;

    @Column(name = "snapshot_data", columnDefinition = "JSONB")
    private String snapshotData;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
