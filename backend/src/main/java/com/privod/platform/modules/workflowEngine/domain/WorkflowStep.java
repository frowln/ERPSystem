package com.privod.platform.modules.workflowEngine.domain;

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

import java.util.UUID;

@Entity
@Table(name = "workflow_steps", indexes = {
        @Index(name = "idx_wf_step_definition", columnList = "workflow_definition_id"),
        @Index(name = "idx_wf_step_from_status", columnList = "from_status"),
        @Index(name = "idx_wf_step_to_status", columnList = "to_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStep extends BaseEntity {

    @Column(name = "workflow_definition_id", nullable = false)
    private UUID workflowDefinitionId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "from_status", length = 50)
    private String fromStatus;

    @Column(name = "to_status", length = 50)
    private String toStatus;

    @Column(name = "required_role", length = 100)
    private String requiredRole;

    @Column(name = "approver_ids", columnDefinition = "JSONB")
    private String approverIds;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "conditions", columnDefinition = "JSONB")
    private String conditions;
}
