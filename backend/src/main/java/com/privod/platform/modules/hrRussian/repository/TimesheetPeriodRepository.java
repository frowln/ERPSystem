package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.TimesheetPeriod;
import com.privod.platform.modules.hrRussian.domain.TimesheetPeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimesheetPeriodRepository extends JpaRepository<TimesheetPeriod, UUID> {

    Optional<TimesheetPeriod> findByEmployeeIdAndMonthAndYearAndDeletedFalse(
            UUID employeeId, int month, int year);

    List<TimesheetPeriod> findByEmployeeIdAndDeletedFalseOrderByYearDescMonthDesc(UUID employeeId);

    List<TimesheetPeriod> findByStatusAndDeletedFalse(TimesheetPeriodStatus status);
}
