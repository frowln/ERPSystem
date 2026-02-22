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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_decisions", indexes = {
        @Index(name = "idx_ad_instance", columnList = "approval_instance_id"),
        @Index(name = "idx_ad_approver", columnList = "approver_id"),
        @Index(name = "idx_ad_step", columnList = "workflow_step_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDecision extends BaseEntity {

    @Column(name = "approval_instance_id", nullable = false)
    private UUID approvalInstanceId;

    @Column(name = "workflow_step_id", nullable = false)
    private UUID workflowStepId;

    @Column(name = "step_order")
    private Integer stepOrder;

    @Column(name = "approver_id", nullable = false)
    private UUID approverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 30)
    private ApprovalDecisionType decision;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "decided_at")
    private Instant decidedAt;
}
