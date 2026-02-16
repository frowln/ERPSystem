package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.ExecutionStatus;
import com.privod.platform.modules.analytics.domain.ReportExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportExecutionRepository extends JpaRepository<ReportExecution, UUID> {

    Page<ReportExecution> findByReportIdAndDeletedFalseOrderByStartedAtDesc(UUID reportId, Pageable pageable);

    List<ReportExecution> findByStatusAndDeletedFalse(ExecutionStatus status);

    Page<ReportExecution> findByExecutedByIdAndDeletedFalseOrderByStartedAtDesc(UUID executedById, Pageable pageable);

    long countByReportIdAndStatusAndDeletedFalse(UUID reportId, ExecutionStatus status);
}
