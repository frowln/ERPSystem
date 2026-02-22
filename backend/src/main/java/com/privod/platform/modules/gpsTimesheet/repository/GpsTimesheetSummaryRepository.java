package com.privod.platform.modules.gpsTimesheet.repository;

import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GpsTimesheetSummaryRepository extends JpaRepository<GpsTimesheetSummary, UUID> {

    Optional<GpsTimesheetSummary> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    @Query("SELECT s FROM GpsTimesheetSummary s WHERE s.organizationId = :orgId AND s.employeeId = :empId " +
            "AND s.periodYear = :year AND s.periodMonth = :month AND s.deleted = false")
    Optional<GpsTimesheetSummary> findByEmployeeAndPeriod(@Param("orgId") UUID organizationId,
                                                           @Param("empId") UUID employeeId,
                                                           @Param("year") int year,
                                                           @Param("month") int month);

    @Query("SELECT s FROM GpsTimesheetSummary s WHERE s.organizationId = :orgId " +
            "AND s.periodYear = :year AND s.periodMonth = :month AND s.deleted = false")
    Page<GpsTimesheetSummary> findByOrgAndPeriod(@Param("orgId") UUID organizationId,
                                                  @Param("year") int year,
                                                  @Param("month") int month,
                                                  Pageable pageable);

    Page<GpsTimesheetSummary> findByOrganizationIdAndEmployeeIdAndDeletedFalse(
            UUID organizationId, UUID employeeId, Pageable pageable);
}
