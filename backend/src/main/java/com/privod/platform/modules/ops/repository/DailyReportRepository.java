package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DailyReportRepository extends JpaRepository<DailyReport, UUID> {

    List<DailyReport> findByWorkOrderIdAndDeletedFalseOrderByReportDateDesc(UUID workOrderId);
}
