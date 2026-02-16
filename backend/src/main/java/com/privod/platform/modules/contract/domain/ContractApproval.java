package com.privod.platform.modules.contract.domain;

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
@Table(name = "contract_approvals", indexes = {
        @Index(name = "idx_contract_approval_contract", columnList = "contract_id"),
        @Index(name = "idx_contract_approval_stage", columnList = "contract_id, stage"),
        @Index(name = "idx_contract_approval_approver", columnList = "approver_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractApproval extends BaseEntity {

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "stage", nullable = false, length = 50)
    private String stage;

    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "approver_name", length = 255)
    private String approverName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
}
