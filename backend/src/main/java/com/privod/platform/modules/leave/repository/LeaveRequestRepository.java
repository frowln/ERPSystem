package com.privod.platform.modules.leave.repository;

import com.privod.platform.modules.leave.domain.LeaveRequest;
import com.privod.platform.modules.leave.domain.LeaveRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID>, JpaSpecificationExecutor<LeaveRequest> {

    Page<LeaveRequest> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    Page<LeaveRequest> findByStatusAndDeletedFalse(LeaveRequestStatus status, Pageable pageable);

    Page<LeaveRequest> findByApproverIdAndStatusAndDeletedFalse(UUID approverId, LeaveRequestStatus status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.deleted = false AND lr.employeeId = :employeeId " +
            "AND lr.status = 'APPROVED' AND lr.leaveTypeId = :leaveTypeId " +
            "AND EXTRACT(YEAR FROM lr.startDate) = :year")
    List<LeaveRequest> findApprovedByEmployeeAndTypeAndYear(
            @Param("employeeId") UUID employeeId,
            @Param("leaveTypeId") UUID leaveTypeId,
            @Param("year") int year);

    @Query("SELECT COALESCE(SUM(lr.numberOfDays), 0) FROM LeaveRequest lr " +
            "WHERE lr.deleted = false AND lr.employeeId = :employeeId " +
            "AND lr.leaveTypeId = :leaveTypeId AND lr.status = 'APPROVED' " +
            "AND EXTRACT(YEAR FROM lr.startDate) = :year")
    BigDecimal sumApprovedDays(
            @Param("employeeId") UUID employeeId,
            @Param("leaveTypeId") UUID leaveTypeId,
            @Param("year") int year);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.deleted = false AND lr.employeeId = :employeeId " +
            "AND lr.status IN ('APPROVED', 'SUBMITTED') " +
            "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlapping(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
