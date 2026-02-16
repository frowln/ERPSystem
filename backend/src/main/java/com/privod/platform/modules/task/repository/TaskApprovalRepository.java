package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.ApprovalStatus;
import com.privod.platform.modules.task.domain.TaskApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskApprovalRepository extends JpaRepository<TaskApproval, UUID> {

    List<TaskApproval> findByTaskIdAndDeletedFalseOrderBySequenceAsc(UUID taskId);

    List<TaskApproval> findByApproverIdAndStatusAndDeletedFalse(UUID approverId, ApprovalStatus status);

    boolean existsByTaskIdAndApproverIdAndDeletedFalse(UUID taskId, UUID approverId);

    long countByTaskIdAndStatusAndDeletedFalse(UUID taskId, ApprovalStatus status);
}
