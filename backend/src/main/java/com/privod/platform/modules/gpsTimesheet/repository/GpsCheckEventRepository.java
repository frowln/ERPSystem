package com.privod.platform.modules.gpsTimesheet.repository;

import com.privod.platform.modules.gpsTimesheet.domain.CheckEventType;
import com.privod.platform.modules.gpsTimesheet.domain.GpsCheckEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GpsCheckEventRepository extends JpaRepository<GpsCheckEvent, UUID> {

    Optional<GpsCheckEvent> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<GpsCheckEvent> findByOrganizationIdAndEmployeeIdAndDeletedFalse(
            UUID organizationId, UUID employeeId, Pageable pageable);

    @Query("SELECT e FROM GpsCheckEvent e WHERE e.organizationId = :orgId AND e.employeeId = :empId " +
            "AND e.recordedAt >= :from AND e.recordedAt <= :to AND e.deleted = false ORDER BY e.recordedAt DESC")
    List<GpsCheckEvent> findByEmployeeAndDateRange(@Param("orgId") UUID organizationId,
                                                    @Param("empId") UUID employeeId,
                                                    @Param("from") Instant from,
                                                    @Param("to") Instant to);

    @Query("SELECT e FROM GpsCheckEvent e WHERE e.organizationId = :orgId AND e.employeeId = :empId " +
            "AND e.eventType = 'CHECK_IN' AND e.deleted = false " +
            "AND NOT EXISTS (SELECT t FROM GpsTimesheetEntry t WHERE t.checkInEventId = e.id AND t.checkOutEventId IS NOT NULL AND t.deleted = false) " +
            "ORDER BY e.recordedAt DESC")
    List<GpsCheckEvent> findOpenCheckIns(@Param("orgId") UUID organizationId,
                                          @Param("empId") UUID employeeId);

    @Query("SELECT e FROM GpsCheckEvent e WHERE e.organizationId = :orgId " +
            "AND e.eventType = :eventType AND e.recordedAt >= :from AND e.recordedAt <= :to " +
            "AND e.deleted = false")
    List<GpsCheckEvent> findByOrgAndTypeAndDateRange(@Param("orgId") UUID organizationId,
                                                      @Param("eventType") CheckEventType eventType,
                                                      @Param("from") Instant from,
                                                      @Param("to") Instant to);

    @Query("SELECT COUNT(e) FROM GpsCheckEvent e WHERE e.organizationId = :orgId " +
            "AND e.eventType = :eventType AND e.recordedAt >= :from AND e.recordedAt <= :to " +
            "AND e.deleted = false")
    long countByOrgAndTypeAndDateRange(@Param("orgId") UUID organizationId,
                                        @Param("eventType") CheckEventType eventType,
                                        @Param("from") Instant from,
                                        @Param("to") Instant to);

    @Query("SELECT COUNT(e) FROM GpsCheckEvent e WHERE e.organizationId = :orgId " +
            "AND e.isWithinGeofence = false AND e.recordedAt >= :from AND e.recordedAt <= :to " +
            "AND e.deleted = false")
    long countGeofenceViolations(@Param("orgId") UUID organizationId,
                                  @Param("from") Instant from,
                                  @Param("to") Instant to);
}
