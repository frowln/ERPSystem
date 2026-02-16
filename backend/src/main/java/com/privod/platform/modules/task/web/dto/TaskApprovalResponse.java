package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ApprovalStatus;
import com.privod.platform.modules.task.domain.TaskApproval;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskApprovalResponse(
        UUID id,
        UUID taskId,
        UUID approverId,
        String approverName,
        ApprovalStatus status,
        String statusDisplayName,
        String comment,
        LocalDateTime approvedAt,
        Integer sequence,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskApprovalResponse fromEntity(TaskApproval approval) {
        return new TaskApprovalResponse(
                approval.getId(),
                approval.getTaskId(),
                approval.getApproverId(),
                approval.getApproverName(),
                approval.getStatus(),
                approval.getStatus().getDisplayName(),
                approval.getComment(),
                approval.getApprovedAt(),
                approval.getSequence(),
                approval.getCreatedAt(),
                approval.getUpdatedAt()
        );
    }
}
