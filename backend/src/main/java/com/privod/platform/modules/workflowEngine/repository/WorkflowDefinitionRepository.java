package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.WorkflowDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, UUID>,
        JpaSpecificationExecutor<WorkflowDefinition> {

    Page<WorkflowDefinition> findByDeletedFalse(Pageable pageable);

    List<WorkflowDefinition> findByEntityTypeAndIsActiveTrueAndDeletedFalse(String entityType);

    Page<WorkflowDefinition> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<WorkflowDefinition> findByIsActiveTrueAndDeletedFalse();
}
