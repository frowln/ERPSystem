package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.AccountPlan;
import com.privod.platform.modules.accounting.domain.AccountType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountPlanRepository extends JpaRepository<AccountPlan, UUID> {

    Optional<AccountPlan> findByOrganizationIdAndCodeAndDeletedFalse(UUID organizationId, String code);

    Optional<AccountPlan> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<AccountPlan> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<AccountPlan> findByOrganizationIdAndAccountTypeAndDeletedFalse(UUID organizationId, AccountType accountType, Pageable pageable);

    List<AccountPlan> findByOrganizationIdAndParentIdAndDeletedFalse(UUID organizationId, UUID parentId);

    List<AccountPlan> findByOrganizationIdAndParentIdIsNullAndDeletedFalseOrderByCodeAsc(UUID organizationId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
