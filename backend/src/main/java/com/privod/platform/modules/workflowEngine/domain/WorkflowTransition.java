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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_transitions", indexes = {
        @Index(name = "idx_wf_trans_step", columnList = "workflow_step_id"),
        @Index(name = "idx_wf_trans_entity", columnList = "entity_id, entity_type"),
        @Index(name = "idx_wf_trans_at", columnList = "transitioned_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransition extends BaseEntity {

    @Column(name = "workflow_step_id", nullable = false)
    private UUID workflowStepId;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "transitioned_by_id")
    private UUID transitionedById;

    @Column(name = "transitioned_at")
    private Instant transitionedAt;

    @Column(name = "from_status", length = 50)
    private String fromStatus;

    @Column(name = "to_status", length = 50)
    private String toStatus;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "duration")
    private Long duration;
}
