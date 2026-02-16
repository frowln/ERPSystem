package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.Timesheet;
import com.privod.platform.modules.hr.domain.TimesheetStatus;
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
public interface TimesheetRepository extends JpaRepository<Timesheet, UUID> {

    Page<Timesheet> findByDeletedFalse(Pageable pageable);

    Page<Timesheet> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    Page<Timesheet> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Timesheet> findByEmployeeIdAndWorkDateBetweenAndDeletedFalse(
            UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<Timesheet> findByProjectIdAndWorkDateBetweenAndDeletedFalse(
            UUID projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.hoursWorked), 0) FROM Timesheet t " +
            "WHERE t.employeeId = :employeeId AND t.workDate BETWEEN :startDate AND :endDate " +
            "AND t.status = :status AND t.deleted = false")
    BigDecimal sumHoursByEmployeeAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") TimesheetStatus status);

    @Query("SELECT COALESCE(SUM(t.hoursWorked), 0) FROM Timesheet t " +
            "WHERE t.projectId = :projectId AND t.workDate BETWEEN :startDate AND :endDate " +
            "AND t.status = 'APPROVED' AND t.deleted = false")
    BigDecimal sumApprovedHoursByProjectAndDateRange(
            @Param("projectId") UUID projectId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
