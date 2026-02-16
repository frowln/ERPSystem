package com.privod.platform.modules.leave.repository;

import com.privod.platform.modules.leave.domain.LeaveAllocation;
import com.privod.platform.modules.leave.domain.LeaveAllocationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveAllocationRepository extends JpaRepository<LeaveAllocation, UUID> {

    Page<LeaveAllocation> findByEmployeeIdAndDeletedFalse(UUID employeeId, Pageable pageable);

    List<LeaveAllocation> findByEmployeeIdAndYearAndDeletedFalse(UUID employeeId, int year);

    Optional<LeaveAllocation> findByEmployeeIdAndLeaveTypeIdAndYearAndDeletedFalse(
            UUID employeeId, UUID leaveTypeId, int year);

    Page<LeaveAllocation> findByStatusAndDeletedFalse(LeaveAllocationStatus status, Pageable pageable);

    Page<LeaveAllocation> findByYearAndDeletedFalse(int year, Pageable pageable);
}
