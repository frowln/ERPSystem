package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.ApprovalStatus;
import com.privod.platform.modules.contract.domain.ContractApproval;

import java.time.Instant;
import java.util.UUID;

public record ContractApprovalResponse(
        UUID id,
        UUID contractId,
        String stage,
        UUID approverId,
        String approverName,
        ApprovalStatus status,
        String statusDisplayName,
        Instant approvedAt,
        Instant rejectedAt,
        String rejectionReason,
        String comment,
        Instant createdAt
) {
    public static ContractApprovalResponse fromEntity(ContractApproval approval) {
        return new ContractApprovalResponse(
                approval.getId(),
                approval.getContractId(),
                approval.getStage(),
                approval.getApproverId(),
                approval.getApproverName(),
                approval.getStatus(),
                approval.getStatus().getDisplayName(),
                approval.getApprovedAt(),
                approval.getRejectedAt(),
                approval.getRejectionReason(),
                approval.getComment(),
                approval.getCreatedAt()
        );
    }
}
