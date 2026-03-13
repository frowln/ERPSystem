package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyReportRepository extends JpaRepository<DailyReport, UUID> {

    List<DailyReport> findByWorkOrderIdAndDeletedFalseOrderByReportDateDesc(UUID workOrderId);

    // P1-CHN-4: суммирует отработанные часы по всем рапортам наряд-задания
    @Query("SELECT COALESCE(SUM(dr.laborHours), 0) FROM DailyReport dr " +
           "WHERE dr.workOrderId = :workOrderId AND dr.deleted = false")
    BigDecimal sumLaborHoursByWorkOrderId(@Param("workOrderId") UUID workOrderId);
}
