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
@Table(name = "task_activities", indexes = {
        @Index(name = "idx_task_activity_task", columnList = "task_id"),
        @Index(name = "idx_task_activity_user", columnList = "user_id"),
        @Index(name = "idx_task_activity_status", columnList = "status"),
        @Index(name = "idx_task_activity_due", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskActivity extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "activity_type_id")
    private UUID activityTypeId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "summary", nullable = false, length = 500)
    private String summary;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TaskActivityStatus status = TaskActivityStatus.PLANNED;

    public boolean isOverdue() {
        return dueDate != null
                && LocalDate.now().isAfter(dueDate)
                && status != TaskActivityStatus.DONE
                && status != TaskActivityStatus.CANCELLED;
    }
}
