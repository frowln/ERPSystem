package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.AutomationExecution;
import com.privod.platform.modules.workflowEngine.domain.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutomationExecutionRepository extends JpaRepository<AutomationExecution, UUID> {

    Page<AutomationExecution> findByAutomationRuleIdAndDeletedFalse(UUID automationRuleId, Pageable pageable);

    List<AutomationExecution> findByEntityIdAndEntityTypeAndDeletedFalseOrderByStartedAtDesc(
            UUID entityId, String entityType);

    List<AutomationExecution> findByExecutionStatusAndDeletedFalse(ExecutionStatus status);

    long countByAutomationRuleIdAndExecutionStatusAndDeletedFalse(UUID automationRuleId, ExecutionStatus status);
}
