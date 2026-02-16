package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.AccountEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountEntryRepository extends JpaRepository<AccountEntry, UUID> {

    Optional<AccountEntry> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<AccountEntry> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<AccountEntry> findByOrganizationIdAndPeriodIdAndDeletedFalse(UUID organizationId, UUID periodId, Pageable pageable);

    Page<AccountEntry> findByOrganizationIdAndJournalIdAndDeletedFalse(UUID organizationId, UUID journalId, Pageable pageable);

    List<AccountEntry> findByOrganizationIdAndIdInAndDeletedFalse(UUID organizationId, List<UUID> ids);

    List<AccountEntry> findByOrganizationIdAndDebitAccountIdAndDeletedFalseOrderByEntryDateDesc(UUID organizationId, UUID debitAccountId);

    List<AccountEntry> findByOrganizationIdAndCreditAccountIdAndDeletedFalseOrderByEntryDateDesc(UUID organizationId, UUID creditAccountId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM AccountEntry e " +
            "WHERE e.organizationId = :organizationId AND e.debitAccountId = :accountId AND e.periodId = :periodId AND e.deleted = false")
    BigDecimal sumDebitByAccountAndPeriod(@Param("accountId") UUID accountId,
                                          @Param("periodId") UUID periodId,
                                          @Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM AccountEntry e " +
            "WHERE e.organizationId = :organizationId AND e.creditAccountId = :accountId AND e.periodId = :periodId AND e.deleted = false")
    BigDecimal sumCreditByAccountAndPeriod(@Param("accountId") UUID accountId,
                                           @Param("periodId") UUID periodId,
                                           @Param("organizationId") UUID organizationId);

    long countByOrganizationIdAndPeriodIdAndDeletedFalse(UUID organizationId, UUID periodId);
}
