package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.AutomationRule;
import com.privod.platform.modules.workflowEngine.domain.WorkflowTriggerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutomationRuleRepository extends JpaRepository<AutomationRule, UUID>,
        JpaSpecificationExecutor<AutomationRule> {

    Page<AutomationRule> findByDeletedFalse(Pageable pageable);

    List<AutomationRule> findByEntityTypeAndTriggerTypeAndIsActiveTrueAndDeletedFalseOrderByPriorityDesc(
            String entityType, WorkflowTriggerType triggerType);

    List<AutomationRule> findByEntityTypeAndIsActiveTrueAndDeletedFalseOrderByPriorityDesc(String entityType);

    Page<AutomationRule> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);
}
