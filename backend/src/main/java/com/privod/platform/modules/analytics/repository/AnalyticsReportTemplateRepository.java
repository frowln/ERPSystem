package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.ReportTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsReportTemplateRepository extends JpaRepository<ReportTemplate, UUID> {

    Page<ReportTemplate> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query("SELECT t FROM ReportTemplate t WHERE t.deleted = false " +
            "AND t.organizationId = :orgId " +
            "AND (t.isPublic = true OR t.createdById = :userId)")
    Page<ReportTemplate> findPublicOrOwnedBy(
            @Param("orgId") UUID organizationId,
            @Param("userId") UUID userId,
            Pageable pageable);

    List<ReportTemplate> findByScheduleEnabledTrueAndDeletedFalse();

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
