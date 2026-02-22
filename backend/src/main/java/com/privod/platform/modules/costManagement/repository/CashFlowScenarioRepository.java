package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CashFlowScenario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowScenarioRepository extends JpaRepository<CashFlowScenario, UUID>,
        JpaSpecificationExecutor<CashFlowScenario> {

    Page<CashFlowScenario> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    List<CashFlowScenario> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID orgId, UUID projectId);

    List<CashFlowScenario> findByOrganizationIdAndProjectIdIsNullAndDeletedFalse(UUID orgId);
}
