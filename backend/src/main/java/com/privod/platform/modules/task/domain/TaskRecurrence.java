package com.privod.platform.modules.task.domain;

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
@Table(name = "task_recurrences", indexes = {
        @Index(name = "idx_task_recurrence_task", columnList = "task_id"),
        @Index(name = "idx_task_recurrence_next", columnList = "next_occurrence"),
        @Index(name = "idx_task_recurrence_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRecurrence extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 20)
    private RecurrenceType recurrenceType;

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    @Column(name = "next_occurrence")
    private LocalDate nextOccurrence;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_count", nullable = false)
    @Builder.Default
    private Integer createdCount = 0;

    public boolean isExpired() {
        return endDate != null && LocalDate.now().isAfter(endDate);
    }

    public boolean isDue() {
        return isActive && nextOccurrence != null
                && !LocalDate.now().isBefore(nextOccurrence)
                && !isExpired();
    }
}
