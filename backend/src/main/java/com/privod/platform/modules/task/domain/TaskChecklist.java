package com.privod.platform.modules.task.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "task_checklists", indexes = {
        @Index(name = "idx_task_checklist_task", columnList = "task_id"),
        @Index(name = "idx_task_checklist_sort", columnList = "task_id, sort_order")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskChecklist extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by_id")
    private UUID completedById;
}
