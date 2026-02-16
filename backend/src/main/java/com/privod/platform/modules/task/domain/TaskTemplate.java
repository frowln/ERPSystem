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

@Entity
@Table(name = "task_templates", indexes = {
        @Index(name = "idx_task_template_category", columnList = "category"),
        @Index(name = "idx_task_template_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_priority", nullable = false, length = 20)
    @Builder.Default
    private TaskPriority defaultPriority = TaskPriority.NORMAL;

    @Column(name = "estimated_hours", precision = 8, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "checklist_template", columnDefinition = "TEXT")
    private String checklistTemplate;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
