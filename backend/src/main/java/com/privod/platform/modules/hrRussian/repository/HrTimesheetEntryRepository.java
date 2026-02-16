package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.HrTimesheetEntry;
import com.privod.platform.modules.hrRussian.domain.TimesheetEntryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface HrTimesheetEntryRepository extends JpaRepository<HrTimesheetEntry, UUID> {

    Page<HrTimesheetEntry> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    Page<HrTimesheetEntry> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<HrTimesheetEntry> findByEmployeeIdAndDateBetweenAndDeletedFalse(
            UUID employeeId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM HrTimesheetEntry t " +
            "WHERE t.employeeId = :employeeId AND t.date BETWEEN :start AND :end " +
            "AND t.status = :status AND t.deleted = false")
    BigDecimal sumHoursByEmployeeAndPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("status") TimesheetEntryStatus status);
}
