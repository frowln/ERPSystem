package com.privod.platform.modules.project.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "project_templates", indexes = {
        @Index(name = "idx_project_templates_type", columnList = "template_type"),
        @Index(name = "idx_project_templates_org", columnList = "organization_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "template_type", nullable = false, length = 50)
    private String templateType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "stages", columnDefinition = "jsonb")
    private String stages;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "budget_items", columnDefinition = "jsonb")
    private String budgetItems;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "task_templates", columnDefinition = "jsonb")
    private String taskTemplates;

    @Column(name = "organization_id")
    private UUID organizationId;
}
