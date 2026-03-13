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

import java.util.UUID;

@Entity
@Table(name = "task_tags", indexes = {
        @Index(name = "idx_task_tag_project", columnList = "project_id"),
        @Index(name = "idx_task_tag_name", columnList = "name")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTag extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "project_id")
    private UUID projectId;
}
