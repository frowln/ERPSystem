package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.CostCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("financeCostCodeRepository")
public interface CostCodeRepository extends JpaRepository<CostCode, UUID> {

    List<CostCode> findByOrganizationIdAndDeletedFalseOrderByCodeAsc(UUID organizationId);

    List<CostCode> findByOrganizationIdAndParentIdAndDeletedFalse(UUID organizationId, UUID parentId);

    List<CostCode> findByOrganizationIdAndParentIdIsNullAndDeletedFalseOrderByCodeAsc(UUID organizationId);

    List<CostCode> findByOrganizationIdAndStandardAndDeletedFalse(UUID organizationId, String standard);

    boolean existsByOrganizationIdAndCodeAndDeletedFalse(UUID organizationId, String code);
}
