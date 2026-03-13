package com.privod.platform.modules.task.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.util.UUID;

@Entity
@Table(name = "task_label_assignments", indexes = {
    @Index(name = "idx_label_assignment_task", columnList = "task_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"task_id", "label_id"})
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskLabelAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "label_id", nullable = false)
    private UUID labelId;
}
