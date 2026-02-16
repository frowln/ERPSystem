package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.WorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, UUID> {

    List<WorkflowStep> findByWorkflowDefinitionIdAndDeletedFalseOrderBySortOrder(UUID workflowDefinitionId);

    Optional<WorkflowStep> findByWorkflowDefinitionIdAndFromStatusAndDeletedFalse(
            UUID workflowDefinitionId, String fromStatus);

    List<WorkflowStep> findByWorkflowDefinitionIdAndFromStatusInAndDeletedFalse(
            UUID workflowDefinitionId, List<String> fromStatuses);
}
