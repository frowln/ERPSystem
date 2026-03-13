package com.privod.platform.modules.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.Filter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "task_dependencies", indexes = {
        @Index(name = "idx_task_dep_task", columnList = "task_id"),
        @Index(name = "idx_task_dep_depends_on", columnList = "depends_on_task_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_task_dependency", columnNames = {"task_id", "depends_on_task_id"})
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "depends_on_task_id", nullable = false)
    private UUID dependsOnTaskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "dependency_type", nullable = false, length = 30)
    @Builder.Default
    private DependencyType dependencyType = DependencyType.FINISH_TO_START;

    @Column(name = "lag_days")
    @Builder.Default
    private int lagDays = 0;
}
