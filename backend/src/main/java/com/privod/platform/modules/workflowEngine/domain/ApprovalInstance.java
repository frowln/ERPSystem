package com.privod.platform.modules.workflowEngine.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_instances", indexes = {
        @Index(name = "idx_ai_org", columnList = "organization_id"),
        @Index(name = "idx_ai_entity", columnList = "entity_id, entity_type"),
        @Index(name = "idx_ai_wf_def", columnList = "workflow_definition_id"),
        @Index(name = "idx_ai_status", columnList = "status"),
        @Index(name = "idx_ai_sla_deadline", columnList = "sla_deadline")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalInstance extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "workflow_definition_id")
    private UUID workflowDefinitionId;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_number", length = 200)
    private String entityNumber;

    @Column(name = "current_step_id")
    private UUID currentStepId;

    @Column(name = "current_step_order")
    @Builder.Default
    private Integer currentStepOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ApprovalInstanceStatus status = ApprovalInstanceStatus.IN_PROGRESS;

    @Column(name = "initiated_by_id")
    private UUID initiatedById;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(name = "escalated_to")
    private UUID escalatedTo;

    @Column(name = "delegated_to")
    private UUID delegatedTo;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
