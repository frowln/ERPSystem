package com.privod.platform.modules.report.repository;

import com.privod.platform.modules.report.domain.GeneratedReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GeneratedReportRepository extends JpaRepository<GeneratedReport, UUID> {

    Page<GeneratedReport> findByTemplateIdAndDeletedFalse(UUID templateId, Pageable pageable);

    Page<GeneratedReport> findByEntityTypeAndEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);

    Page<GeneratedReport> findByGeneratedByIdAndDeletedFalse(UUID generatedById, Pageable pageable);
}
