package com.privod.platform.modules.esg.repository;

import com.privod.platform.modules.esg.domain.EsgReport;
import com.privod.platform.modules.esg.domain.EsgReportStatus;
import com.privod.platform.modules.esg.domain.EsgReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EsgReportRepository extends JpaRepository<EsgReport, UUID> {

    Page<EsgReport> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<EsgReport> findByOrganizationIdAndReportTypeAndDeletedFalse(UUID organizationId, EsgReportType reportType, Pageable pageable);

    Page<EsgReport> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, EsgReportStatus status, Pageable pageable);

    Page<EsgReport> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Optional<EsgReport> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
