package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.AnalyticsReport;
import com.privod.platform.modules.analytics.domain.BiReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsReportRepository extends JpaRepository<AnalyticsReport, UUID>, JpaSpecificationExecutor<AnalyticsReport> {

    Page<AnalyticsReport> findByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<AnalyticsReport> findByReportTypeAndDeletedFalseOrderByCreatedAtDesc(
            BiReportType reportType, Pageable pageable);

    Page<AnalyticsReport> findByCreatedByIdAndDeletedFalseOrderByCreatedAtDesc(
            UUID createdById, Pageable pageable);

    Page<AnalyticsReport> findByCategoryAndDeletedFalseOrderByCreatedAtDesc(
            String category, Pageable pageable);

    @Query("SELECT r FROM AnalyticsReport r WHERE r.deleted = false AND " +
            "(r.isPublic = true OR r.createdById = :userId) " +
            "ORDER BY r.createdAt DESC")
    Page<AnalyticsReport> findAccessibleReports(@Param("userId") UUID userId, Pageable pageable);

    List<AnalyticsReport> findByReportTypeAndDeletedFalse(BiReportType reportType);
}
