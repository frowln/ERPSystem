package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.CashFlowProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CashFlowProjectionRepository extends JpaRepository<CashFlowProjection, UUID> {

    Page<CashFlowProjection> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<CashFlowProjection> findByProjectIdAndDeletedFalseOrderByPeriodStartAsc(UUID projectId);

    @Query("SELECT cfp FROM CashFlowProjection cfp WHERE cfp.projectId = :projectId " +
            "AND cfp.periodStart >= :startDate AND cfp.periodEnd <= :endDate AND cfp.deleted = false " +
            "ORDER BY cfp.periodStart ASC")
    List<CashFlowProjection> findByProjectIdAndDateRange(@Param("projectId") UUID projectId,
                                                          @Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(cfp.plannedIncome), 0) FROM CashFlowProjection cfp " +
            "WHERE cfp.projectId = :projectId AND cfp.deleted = false")
    BigDecimal sumPlannedIncomeByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(cfp.actualExpense), 0) FROM CashFlowProjection cfp " +
            "WHERE cfp.projectId = :projectId AND cfp.deleted = false")
    BigDecimal sumActualExpenseByProjectId(@Param("projectId") UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
