package com.privod.platform.modules.task;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.ApprovalStatus;
import com.privod.platform.modules.task.domain.TaskApproval;
import com.privod.platform.modules.task.repository.TaskApprovalRepository;
import com.privod.platform.modules.task.service.TaskApprovalService;
import com.privod.platform.modules.task.web.dto.CreateTaskApprovalRequest;
import com.privod.platform.modules.task.web.dto.ProcessApprovalRequest;
import com.privod.platform.modules.task.web.dto.TaskApprovalResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskApprovalServiceTest {

    @Mock
    private TaskApprovalRepository approvalRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TaskApprovalService taskApprovalService;

    private UUID approvalId;
    private UUID taskId;
    private UUID approverId;
    private TaskApproval testApproval;

    @BeforeEach
    void setUp() {
        approvalId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        approverId = UUID.randomUUID();

        testApproval = TaskApproval.builder()
                .taskId(taskId)
                .approverId(approverId)
                .approverName("Иванов И.И.")
                .status(ApprovalStatus.PENDING)
                .sequence(1)
                .build();
        testApproval.setId(approvalId);
        testApproval.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Request Approval")
    class RequestApprovalTests {

        @Test
        @DisplayName("Should create new approval request with PENDING status")
        void requestApproval_NewApprover_CreatesWithPendingStatus() {
            UUID newApproverId = UUID.randomUUID();
            CreateTaskApprovalRequest request = new CreateTaskApprovalRequest(
                    newApproverId, "Петров П.П.", 2);

            when(approvalRepository.existsByTaskIdAndApproverIdAndDeletedFalse(taskId, newApproverId))
                    .thenReturn(false);
            when(approvalRepository.save(any(TaskApproval.class))).thenAnswer(invocation -> {
                TaskApproval a = invocation.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            TaskApprovalResponse response = taskApprovalService.requestApproval(taskId, request);

            assertThat(response.status()).isEqualTo(ApprovalStatus.PENDING);
            assertThat(response.approverName()).isEqualTo("Петров П.П.");
            assertThat(response.taskId()).isEqualTo(taskId);
            assertThat(response.sequence()).isEqualTo(2);
            verify(auditService).logCreate(eq("TaskApproval"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when duplicate approval exists for same task and approver")
        void requestApproval_DuplicateApprover_ThrowsException() {
            CreateTaskApprovalRequest request = new CreateTaskApprovalRequest(
                    approverId, "Иванов И.И.", 1);

            when(approvalRepository.existsByTaskIdAndApproverIdAndDeletedFalse(taskId, approverId))
                    .thenReturn(true);

            assertThatThrownBy(() -> taskApprovalService.requestApproval(taskId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утверждение от этого пользователя уже существует");
        }

        @Test
        @DisplayName("Should default sequence to 0 when not specified")
        void requestApproval_NullSequence_DefaultsToZero() {
            UUID newApproverId = UUID.randomUUID();
            CreateTaskApprovalRequest request = new CreateTaskApprovalRequest(
                    newApproverId, "Сидоров С.С.", null);

            when(approvalRepository.existsByTaskIdAndApproverIdAndDeletedFalse(taskId, newApproverId))
                    .thenReturn(false);
            when(approvalRepository.save(any(TaskApproval.class))).thenAnswer(invocation -> {
                TaskApproval a = invocation.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            TaskApprovalResponse response = taskApprovalService.requestApproval(taskId, request);

            assertThat(response.sequence()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Process Approval")
    class ProcessApprovalTests {

        @Test
        @DisplayName("Should approve pending approval and set approvedAt")
        void processApproval_Approve_SetsApprovedStatus() {
            when(approvalRepository.findById(approvalId)).thenReturn(Optional.of(testApproval));
            when(approvalRepository.save(any(TaskApproval.class))).thenAnswer(inv -> inv.getArgument(0));

            ProcessApprovalRequest request = new ProcessApprovalRequest(
                    ApprovalStatus.APPROVED, "Одобрено без замечаний");

            TaskApprovalResponse response = taskApprovalService.processApproval(approvalId, request);

            assertThat(response.status()).isEqualTo(ApprovalStatus.APPROVED);
            assertThat(response.comment()).isEqualTo("Одобрено без замечаний");
            assertThat(response.approvedAt()).isNotNull();
            verify(auditService).logStatusChange("TaskApproval", approvalId, "PENDING", "APPROVED");
        }

        @Test
        @DisplayName("Should reject pending approval and set approvedAt")
        void processApproval_Reject_SetsRejectedStatus() {
            when(approvalRepository.findById(approvalId)).thenReturn(Optional.of(testApproval));
            when(approvalRepository.save(any(TaskApproval.class))).thenAnswer(inv -> inv.getArgument(0));

            ProcessApprovalRequest request = new ProcessApprovalRequest(
                    ApprovalStatus.REJECTED, "Необходимо доработать");

            TaskApprovalResponse response = taskApprovalService.processApproval(approvalId, request);

            assertThat(response.status()).isEqualTo(ApprovalStatus.REJECTED);
            assertThat(response.comment()).isEqualTo("Необходимо доработать");
            assertThat(response.approvedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw when processing already-processed approval")
        void processApproval_AlreadyProcessed_ThrowsException() {
            testApproval.setStatus(ApprovalStatus.APPROVED);
            when(approvalRepository.findById(approvalId)).thenReturn(Optional.of(testApproval));

            ProcessApprovalRequest request = new ProcessApprovalRequest(
                    ApprovalStatus.REJECTED, "Пытаюсь изменить");

            assertThatThrownBy(() -> taskApprovalService.processApproval(approvalId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Утверждение уже обработано со статусом");
        }
    }

    @Nested
    @DisplayName("Get Pending Approvals")
    class GetPendingApprovalsTests {

        @Test
        @DisplayName("Should return pending approvals for a given approver")
        void getPendingApprovals_ExistingApprovals_ReturnsList() {
            when(approvalRepository.findByApproverIdAndStatusAndDeletedFalse(approverId, ApprovalStatus.PENDING))
                    .thenReturn(List.of(testApproval));

            List<TaskApprovalResponse> result = taskApprovalService.getPendingApprovals(approverId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).approverId()).isEqualTo(approverId);
            assertThat(result.get(0).status()).isEqualTo(ApprovalStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("Is Fully Approved")
    class IsFullyApprovedTests {

        @Test
        @DisplayName("Should return true when no pending and no rejected approvals exist")
        void isFullyApproved_AllApproved_ReturnsTrue() {
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.PENDING))
                    .thenReturn(0L);
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.REJECTED))
                    .thenReturn(0L);

            boolean result = taskApprovalService.isFullyApproved(taskId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when pending approvals exist")
        void isFullyApproved_PendingExists_ReturnsFalse() {
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.PENDING))
                    .thenReturn(2L);
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.REJECTED))
                    .thenReturn(0L);

            boolean result = taskApprovalService.isFullyApproved(taskId);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false when rejected approvals exist")
        void isFullyApproved_RejectedExists_ReturnsFalse() {
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.PENDING))
                    .thenReturn(0L);
            when(approvalRepository.countByTaskIdAndStatusAndDeletedFalse(taskId, ApprovalStatus.REJECTED))
                    .thenReturn(1L);

            boolean result = taskApprovalService.isFullyApproved(taskId);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("Delete Approval")
    class DeleteApprovalTests {

        @Test
        @DisplayName("Should soft-delete approval and log audit")
        void deleteApproval_ExistingApproval_SoftDeletes() {
            when(approvalRepository.findById(approvalId)).thenReturn(Optional.of(testApproval));
            when(approvalRepository.save(any(TaskApproval.class))).thenAnswer(inv -> inv.getArgument(0));

            taskApprovalService.deleteApproval(approvalId);

            assertThat(testApproval.isDeleted()).isTrue();
            verify(approvalRepository).save(testApproval);
            verify(auditService).logDelete("TaskApproval", approvalId);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when deleting non-existing approval")
        void deleteApproval_NotFound_ThrowsException() {
            UUID missingId = UUID.randomUUID();
            when(approvalRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskApprovalService.deleteApproval(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Утверждение не найдено");
        }
    }
}
