package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.ReconciliationAct;
import com.privod.platform.modules.finance.domain.ReconciliationActStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationActRepository extends JpaRepository<ReconciliationAct, UUID>,
        JpaSpecificationExecutor<ReconciliationAct> {

    Optional<ReconciliationAct> findByActNumberAndDeletedFalse(String actNumber);

    Page<ReconciliationAct> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId, Pageable pageable);

    Page<ReconciliationAct> findByStatusAndDeletedFalse(ReconciliationActStatus status, Pageable pageable);

    List<ReconciliationAct> findByContractIdAndDeletedFalse(UUID contractId);

    @Query("SELECT ra FROM ReconciliationAct ra WHERE ra.deleted = false AND " +
            "ra.periodStart >= :dateFrom AND ra.periodEnd <= :dateTo")
    Page<ReconciliationAct> findByPeriod(@Param("dateFrom") LocalDate dateFrom,
                                          @Param("dateTo") LocalDate dateTo, Pageable pageable);

    @Query("SELECT COALESCE(SUM(ra.discrepancy), 0) FROM ReconciliationAct ra " +
            "WHERE ra.counterpartyId = :counterpartyId AND ra.status = 'DISPUTED' AND ra.deleted = false")
    BigDecimal sumDiscrepancyByCounterparty(@Param("counterpartyId") UUID counterpartyId);

    long countByCounterpartyIdAndDeletedFalse(UUID counterpartyId);
}
