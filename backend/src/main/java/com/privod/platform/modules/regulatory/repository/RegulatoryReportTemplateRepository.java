package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.ReportFrequency;
import com.privod.platform.modules.regulatory.domain.ReportTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RegulatoryReportTemplateRepository extends JpaRepository<ReportTemplate, UUID> {

    List<ReportTemplate> findByReportTypeAndDeletedFalse(String reportType);

    Page<ReportTemplate> findByDeletedFalse(Pageable pageable);

    List<ReportTemplate> findByFrequencyAndDeletedFalse(ReportFrequency frequency);
}
