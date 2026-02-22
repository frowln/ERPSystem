package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyRiskReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SafetyRiskReportRepository extends JpaRepository<SafetyRiskReport, UUID> {

    Page<SafetyRiskReport> findByOrganizationIdAndDeletedFalseOrderByReportWeekDesc(
            UUID organizationId, Pageable pageable);

    Optional<SafetyRiskReport> findByOrganizationIdAndReportWeekAndDeletedFalse(
            UUID organizationId, String reportWeek);
}
