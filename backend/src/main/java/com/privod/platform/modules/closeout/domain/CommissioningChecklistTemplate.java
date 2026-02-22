package com.privod.platform.modules.closeout.domain;

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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "commissioning_checklist_templates", indexes = {
        @Index(name = "idx_comm_template_org_system", columnList = "organization_id, system"),
        @Index(name = "idx_comm_template_org_project", columnList = "organization_id, project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissioningChecklistTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "system", length = 100)
    private String system;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "check_item_definitions", columnDefinition = "TEXT")
    private String checkItemDefinitions;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
