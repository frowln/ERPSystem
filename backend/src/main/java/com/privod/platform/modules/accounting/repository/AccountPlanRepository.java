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

    Optional<AccountPlan> findByCodeAndDeletedFalse(String code);

    Page<AccountPlan> findByDeletedFalse(Pageable pageable);

    Page<AccountPlan> findByAccountTypeAndDeletedFalse(AccountType accountType, Pageable pageable);

    List<AccountPlan> findByParentIdAndDeletedFalse(UUID parentId);

    List<AccountPlan> findByParentIdIsNullAndDeletedFalseOrderByCodeAsc();

    long countByDeletedFalse();
}
