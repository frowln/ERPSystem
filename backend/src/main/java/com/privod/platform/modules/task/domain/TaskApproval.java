package com.privod.platform.modules.task.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "task_approvals", indexes = {
        @Index(name = "idx_task_approval_task", columnList = "task_id"),
        @Index(name = "idx_task_approval_approver", columnList = "approver_id"),
        @Index(name = "idx_task_approval_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskApproval extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "approver_id", nullable = false)
    private UUID approverId;

    @Column(name = "approver_name", length = 255)
    private String approverName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    public boolean isPending() {
        return status == ApprovalStatus.PENDING;
    }
}
