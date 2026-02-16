package com.privod.platform.modules.report.repository;

import com.privod.platform.modules.report.domain.ReportTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, UUID> {

    Optional<ReportTemplate> findByCodeAndDeletedFalse(String code);

    Page<ReportTemplate> findByDeletedFalse(Pageable pageable);

    Page<ReportTemplate> findByReportTypeAndDeletedFalse(String reportType, Pageable pageable);

    Page<ReportTemplate> findByIsActiveTrueAndDeletedFalse(Pageable pageable);

    boolean existsByCodeAndDeletedFalse(String code);
}
