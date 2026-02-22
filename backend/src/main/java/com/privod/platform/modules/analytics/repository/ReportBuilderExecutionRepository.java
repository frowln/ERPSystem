package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.ReportBuilderExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportBuilderExecutionRepository extends JpaRepository<ReportBuilderExecution, UUID> {

    Page<ReportBuilderExecution> findByTemplateIdAndDeletedFalseOrderByCreatedAtDesc(UUID templateId, Pageable pageable);

    Page<ReportBuilderExecution> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    void deleteByTemplateId(UUID templateId);
}
