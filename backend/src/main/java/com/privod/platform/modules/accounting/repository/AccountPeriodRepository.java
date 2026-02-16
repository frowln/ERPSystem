package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.PeriodStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountPeriodRepository extends JpaRepository<AccountPeriod, UUID> {

    Optional<AccountPeriod> findByOrganizationIdAndYearAndMonthAndDeletedFalse(UUID organizationId, Integer year, Integer month);

    Optional<AccountPeriod> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<AccountPeriod> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    // Legacy signatures kept for backward compatibility with older service implementations.
    Optional<AccountPeriod> findByYearAndMonthAndDeletedFalse(Integer year, Integer month);

    Page<AccountPeriod> findByDeletedFalse(Pageable pageable);

    List<AccountPeriod> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, PeriodStatus status);

    List<AccountPeriod> findByOrganizationIdAndYearAndDeletedFalseOrderByMonthAsc(UUID organizationId, Integer year);
}
