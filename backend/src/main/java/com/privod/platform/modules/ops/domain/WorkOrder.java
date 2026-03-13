package com.privod.platform.modules.ops.domain;

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
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_orders", indexes = {
        @Index(name = "idx_wo_project", columnList = "project_id"),
        @Index(name = "idx_wo_status", columnList = "status"),
        @Index(name = "idx_wo_priority", columnList = "priority"),
        @Index(name = "idx_wo_foreman", columnList = "foreman_id"),
        @Index(name = "idx_wo_planned_start", columnList = "planned_start"),
        @Index(name = "idx_wo_code", columnList = "code")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrder extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 30)
    private WorkType workType;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "assigned_crew_id")
    private UUID assignedCrewId;

    @Column(name = "foreman_id")
    private UUID foremanId;

    @Column(name = "planned_start")
    private LocalDate plannedStart;

    @Column(name = "planned_end")
    private LocalDate plannedEnd;

    @Column(name = "actual_start")
    private LocalDate actualStart;

    @Column(name = "actual_end")
    private LocalDate actualEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

    @Column(name = "completion_percent", nullable = false)
    @Builder.Default
    private Integer completionPercent = 0;

    // P0-5: FK на задачу (ProjectTask), из которой создан или с которой связан наряд.
    // Закрывает разрыв Task↔WorkOrder — теперь можно отследить Задача→Наряд→Рапорт.
    @Column(name = "task_id")
    private UUID taskId;

    public boolean canTransitionTo(WorkOrderStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
