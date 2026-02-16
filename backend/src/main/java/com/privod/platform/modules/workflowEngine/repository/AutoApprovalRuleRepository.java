package com.privod.platform.modules.workflowEngine.repository;

import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import com.privod.platform.modules.workflowEngine.domain.AutoApprovalRule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutoApprovalRuleRepository extends JpaRepository<AutoApprovalRule, UUID>,
        JpaSpecificationExecutor<AutoApprovalRule> {

    Page<AutoApprovalRule> findByDeletedFalse(Pageable pageable);

    List<AutoApprovalRule> findByEntityTypeAndIsActiveTrueAndDeletedFalse(ApprovalEntityType entityType);

    Page<AutoApprovalRule> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<AutoApprovalRule> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<AutoApprovalRule> findByEntityTypeAndOrganizationIdAndIsActiveTrueAndDeletedFalse(
            ApprovalEntityType entityType, UUID organizationId);
}
