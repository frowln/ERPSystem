package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.ApprovalDecision;
import com.privod.platform.modules.workflowEngine.domain.ApprovalDecisionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalDecisionRepository extends JpaRepository<ApprovalDecision, UUID> {

    List<ApprovalDecision> findByApprovalInstanceIdAndDeletedFalse(UUID approvalInstanceId);

    Page<ApprovalDecision> findByApproverIdAndDeletedFalse(UUID approverId, Pageable pageable);

    long countByApprovalInstanceIdAndDecisionAndDeletedFalse(
            UUID approvalInstanceId, ApprovalDecisionType decision);
}
