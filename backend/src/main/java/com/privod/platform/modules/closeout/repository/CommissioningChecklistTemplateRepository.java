package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.CommissioningChecklistTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommissioningChecklistTemplateRepository extends JpaRepository<CommissioningChecklistTemplate, UUID>,
        JpaSpecificationExecutor<CommissioningChecklistTemplate> {

    Page<CommissioningChecklistTemplate> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    List<CommissioningChecklistTemplate> findByOrganizationIdAndSystemAndDeletedFalseOrderBySortOrder(UUID orgId, String system);

    List<CommissioningChecklistTemplate> findByOrganizationIdAndProjectIdAndDeletedFalseOrderBySortOrder(UUID orgId, UUID projectId);

    List<CommissioningChecklistTemplate> findByOrganizationIdAndProjectIdIsNullAndDeletedFalseOrderBySortOrder(UUID orgId);
}
