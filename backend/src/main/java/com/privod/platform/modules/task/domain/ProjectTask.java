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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_tasks", indexes = {
        @Index(name = "idx_task_project", columnList = "project_id"),
        @Index(name = "idx_task_parent", columnList = "parent_task_id"),
        @Index(name = "idx_task_status", columnList = "status"),
        @Index(name = "idx_task_priority", columnList = "priority"),
        @Index(name = "idx_task_assignee", columnList = "assignee_id"),
        @Index(name = "idx_task_code", columnList = "code", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTask extends BaseEntity {

    @Column(name = "code", unique = true, nullable = false, length = 20)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "parent_task_id")
    private UUID parentTaskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TaskStatus status = TaskStatus.BACKLOG;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private TaskPriority priority = TaskPriority.NORMAL;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(name = "assignee_name", length = 255)
    private String assigneeName;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @Column(name = "reporter_name", length = 255)
    private String reporterName;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "estimated_hours", precision = 8, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal actualHours = BigDecimal.ZERO;

    @Column(name = "progress")
    @Builder.Default
    private Integer progress = 0;

    @Column(name = "wbs_code", length = 100)
    private String wbsCode;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(TaskStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public boolean isOverdue() {
        if (plannedEndDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(plannedEndDate)
                && status != TaskStatus.DONE
                && status != TaskStatus.CANCELLED;
    }
}
