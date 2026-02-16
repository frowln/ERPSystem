package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.CashFlowEntry;
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
import java.util.UUID;

@Repository
public interface CashFlowEntryRepository extends JpaRepository<CashFlowEntry, UUID>, JpaSpecificationExecutor<CashFlowEntry> {

    Page<CashFlowEntry> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("SELECT c FROM CashFlowEntry c WHERE c.projectId = :projectId " +
            "AND c.entryDate >= :dateFrom AND c.entryDate <= :dateTo " +
            "AND c.deleted = false ORDER BY c.entryDate ASC")
    List<CashFlowEntry> findByProjectIdAndDateRange(@Param("projectId") UUID projectId,
                                                     @Param("dateFrom") LocalDate dateFrom,
                                                     @Param("dateTo") LocalDate dateTo);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c " +
            "WHERE c.projectId = :projectId AND c.direction = :direction AND c.deleted = false")
    BigDecimal sumByProjectIdAndDirection(@Param("projectId") UUID projectId,
                                          @Param("direction") String direction);

    @Query("SELECT EXTRACT(YEAR FROM c.entryDate), EXTRACT(MONTH FROM c.entryDate), c.direction, " +
            "COALESCE(SUM(c.amount), 0) FROM CashFlowEntry c " +
            "WHERE c.projectId = :projectId AND c.deleted = false " +
            "GROUP BY EXTRACT(YEAR FROM c.entryDate), EXTRACT(MONTH FROM c.entryDate), c.direction " +
            "ORDER BY EXTRACT(YEAR FROM c.entryDate), EXTRACT(MONTH FROM c.entryDate)")
    List<Object[]> getMonthlySummaryByProjectId(@Param("projectId") UUID projectId);
}
