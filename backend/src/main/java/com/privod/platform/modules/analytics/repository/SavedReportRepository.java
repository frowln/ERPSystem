package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.ReportType;
import com.privod.platform.modules.analytics.domain.SavedReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedReportRepository extends JpaRepository<SavedReport, UUID>, JpaSpecificationExecutor<SavedReport> {

    Optional<SavedReport> findByCodeAndDeletedFalse(String code);

    Page<SavedReport> findByCreatedByIdAndDeletedFalse(UUID createdById, Pageable pageable);

    Page<SavedReport> findByReportTypeAndDeletedFalse(ReportType reportType, Pageable pageable);

    Page<SavedReport> findByDeletedFalse(Pageable pageable);

    List<SavedReport> findByScheduleEnabledTrueAndDeletedFalse();

    @Query(value = "SELECT nextval('report_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
