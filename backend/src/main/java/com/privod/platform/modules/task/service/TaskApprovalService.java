package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.task.domain.ApprovalStatus;
import com.privod.platform.modules.task.domain.TaskApproval;
import com.privod.platform.modules.task.repository.TaskApprovalRepository;
import com.privod.platform.modules.task.web.dto.CreateTaskApprovalRequest;
import com.privod.platform.modules.task.web.dto.ProcessApprovalRequest;
import com.privod.platform.modules.task.web.dto.TaskApprovalResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskApprovalService {

    private final TaskApprovalRepository approvalRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TaskApprovalResponse> getTaskApprovals(UUID taskId) {
        return approvalRepository.findByTaskIdAndDeletedFalseOrderBySequenceAsc(taskId)
                .stream()
                .map(TaskApprovalResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskApprovalResponse> getPendingApprovals(UUID approverId) {
        return approvalRepository.findByApproverIdAndStatusAndDeletedFalse(approverId, ApprovalStatus.PENDING)
                .stream()
                .map(TaskApprovalResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskApprovalResponse requestApproval(UUID taskId, CreateTaskApprovalRequest request) {
        if (approvalRepository.existsByTaskIdAndApproverIdAndDeletedFalse(taskId, request.approverId())) {
            throw new IllegalStateException("Утверждение от этого пользователя уже существует для данной задачи");
        }

        TaskApproval approval = TaskApproval.builder()
                .taskId(taskId)
                .approverId(request.approverId())
                .approverName(request.approverName())
                .status(ApprovalStatus.PENDING)
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .build();

        approval = approvalRepository.save(approval);
        auditService.logCreate("TaskApproval", approval.getId());

        // Send notification to the approver that their approval is needed
        notificationService.send(
                request.approverId(),
                "Требуется согласование",
                "Вас запросили согласовать задачу (ID: " + taskId + ")",
                NotificationType.APPROVAL,
                "TaskApproval",
                approval.getId(),
                "/tasks/" + taskId + "/approvals"
        );

        log.info("Approval requested for task {}: approver={} ({})", taskId, request.approverName(), approval.getId());
        return TaskApprovalResponse.fromEntity(approval);
    }

    @Transactional
    public TaskApprovalResponse processApproval(UUID approvalId, ProcessApprovalRequest request) {
        TaskApproval approval = getApprovalOrThrow(approvalId);

        if (!approval.isPending()) {
            throw new IllegalStateException(
                    String.format("Утверждение уже обработано со статусом: %s", approval.getStatus().getDisplayName()));
        }

        ApprovalStatus oldStatus = approval.getStatus();
        approval.setStatus(request.status());
        approval.setComment(request.comment());

        if (request.status() == ApprovalStatus.APPROVED || request.status() == ApprovalStatus.REJECTED) {
            approval.setApprovedAt(LocalDateTime.now());
        }

        approval = approvalRepository.save(approval);
        auditService.logStatusChange("TaskApproval", approval.getId(), oldStatus.name(), request.status().name());

        log.info("Approval processed: {} status={} ({})", approval.getTaskId(), request.status(), approval.getId());
        return TaskApprovalResponse.fromEntity(approval);
    }

    @Transactional(readOnly = true)
    public boolean isFullyApproved(UUID taskId) {
        long pending = approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.PENDING);
        long rejected = approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.REJECTED);
        return pending == 0 && rejected == 0;
    }

    @Transactional
    public void deleteApproval(UUID approvalId) {
        TaskApproval approval = getApprovalOrThrow(approvalId);
        approval.softDelete();
        approvalRepository.save(approval);
        auditService.logDelete("TaskApproval", approvalId);
        log.info("Approval soft-deleted: {} ({})", approval.getTaskId(), approvalId);
    }

    private TaskApproval getApprovalOrThrow(UUID id) {
        return approvalRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Утверждение не найдено: " + id));
    }
}
