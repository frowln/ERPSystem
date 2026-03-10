package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.SickLeave;
import com.privod.platform.modules.hrRussian.domain.SickLeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SickLeaveRepository extends JpaRepository<SickLeave, UUID> {

    Page<SickLeave> findByDeletedFalse(Pageable pageable);

    List<SickLeave> findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(UUID employeeId);

    List<SickLeave> findByEmployeeIdAndStatusAndDeletedFalse(UUID employeeId, SickLeaveStatus status);

    List<SickLeave> findByStatusAndDeletedFalse(SickLeaveStatus status);
}
