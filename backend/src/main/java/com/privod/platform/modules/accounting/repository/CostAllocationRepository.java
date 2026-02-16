package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.CostAllocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CostAllocationRepository extends JpaRepository<CostAllocation, UUID> {

    Page<CostAllocation> findByCostCenterIdAndDeletedFalse(UUID costCenterId, Pageable pageable);

    List<CostAllocation> findByPeriodIdAndDeletedFalse(UUID periodId);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM CostAllocation a " +
            "WHERE a.costCenterId = :costCenterId AND a.periodId = :periodId AND a.deleted = false")
    BigDecimal sumByCostCenterAndPeriod(@Param("costCenterId") UUID costCenterId,
                                         @Param("periodId") UUID periodId);
}
