package com.privod.platform.modules.gpsTimesheet.repository;

import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GpsTimesheetEntryRepository extends JpaRepository<GpsTimesheetEntry, UUID> {

    Optional<GpsTimesheetEntry> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<GpsTimesheetEntry> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId AND e.employeeId = :empId " +
            "AND e.workDate >= :from AND e.workDate <= :to AND e.deleted = false ORDER BY e.workDate DESC")
    List<GpsTimesheetEntry> findByEmployeeAndDateRange(@Param("orgId") UUID organizationId,
                                                        @Param("empId") UUID employeeId,
                                                        @Param("from") LocalDate from,
                                                        @Param("to") LocalDate to);

    Page<GpsTimesheetEntry> findByOrganizationIdAndProjectIdAndDeletedFalse(
            UUID organizationId, UUID projectId, Pageable pageable);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.isVerified = false AND e.deleted = false ORDER BY e.workDate DESC")
    Page<GpsTimesheetEntry> findUnverified(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.employeeId = :empId AND e.workDate >= :from AND e.workDate <= :to AND e.deleted = false")
    List<GpsTimesheetEntry> findByOrgAndEmployeeAndPeriod(@Param("orgId") UUID organizationId,
                                                           @Param("empId") UUID employeeId,
                                                           @Param("from") LocalDate from,
                                                           @Param("to") LocalDate to);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId AND e.checkInEventId = :checkInEventId " +
            "AND e.deleted = false")
    Optional<GpsTimesheetEntry> findByCheckInEventId(@Param("orgId") UUID organizationId,
                                                      @Param("checkInEventId") UUID checkInEventId);

    @Query("SELECT COALESCE(SUM(e.totalHours), 0) FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.workDate = :workDate AND e.checkOutTime IS NOT NULL AND e.deleted = false")
    BigDecimal sumHoursForDate(@Param("orgId") UUID organizationId, @Param("workDate") LocalDate workDate);

    @Query("SELECT COUNT(DISTINCT e.employeeId) FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.workDate = :workDate AND e.checkOutTime IS NULL AND e.deleted = false")
    long countActiveOnSite(@Param("orgId") UUID organizationId, @Param("workDate") LocalDate workDate);

    @Query("SELECT COUNT(DISTINCT e.employeeId) FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.workDate = :workDate AND e.checkOutTime IS NOT NULL AND e.deleted = false")
    long countCheckedOutToday(@Param("orgId") UUID organizationId, @Param("workDate") LocalDate workDate);

    @Query("SELECT COUNT(DISTINCT e.employeeId) FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.workDate = :workDate AND e.deleted = false")
    long countCheckedInToday(@Param("orgId") UUID organizationId, @Param("workDate") LocalDate workDate);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.workDate >= :from AND e.workDate <= :to AND e.deleted = false")
    List<GpsTimesheetEntry> findByOrgAndPeriod(@Param("orgId") UUID organizationId,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    @Query("SELECT e FROM GpsTimesheetEntry e WHERE e.organizationId = :orgId " +
            "AND e.employeeId = :empId AND e.workDate >= :from AND e.workDate <= :to " +
            "AND e.deleted = false " +
            "ORDER BY e.workDate, e.checkInTime")
    Page<GpsTimesheetEntry> findByEmployeeAndDateRange(@Param("orgId") UUID organizationId,
                                                        @Param("empId") UUID employeeId,
                                                        @Param("from") LocalDate from,
                                                        @Param("to") LocalDate to,
                                                        Pageable pageable);
}
