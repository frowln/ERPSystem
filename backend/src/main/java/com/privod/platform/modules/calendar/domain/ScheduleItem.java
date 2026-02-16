package com.privod.platform.modules.calendar.domain;

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
@Table(name = "schedule_items", indexes = {
        @Index(name = "idx_schedule_item_schedule", columnList = "schedule_id"),
        @Index(name = "idx_schedule_item_parent", columnList = "parent_item_id"),
        @Index(name = "idx_schedule_item_predecessor", columnList = "predecessor_item_id"),
        @Index(name = "idx_schedule_item_work_type", columnList = "work_type"),
        @Index(name = "idx_schedule_item_critical", columnList = "is_critical_path")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleItem extends BaseEntity {

    @Column(name = "schedule_id", nullable = false)
    private UUID scheduleId;

    @Column(name = "parent_item_id")
    private UUID parentItemId;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 30)
    private WorkType workType;

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

    @Column(name = "progress", nullable = false)
    @Builder.Default
    private Integer progress = 0;

    @Column(name = "predecessor_item_id")
    private UUID predecessorItemId;

    @Column(name = "lag_days")
    @Builder.Default
    private Integer lagDays = 0;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 255)
    private String responsibleName;

    @Column(name = "is_critical_path", nullable = false)
    @Builder.Default
    private boolean isCriticalPath = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
