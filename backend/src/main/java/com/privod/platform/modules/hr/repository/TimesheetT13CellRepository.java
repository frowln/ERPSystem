package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.TimesheetT13Cell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimesheetT13CellRepository extends JpaRepository<TimesheetT13Cell, UUID> {

    List<TimesheetT13Cell> findByProjectIdAndMonthAndYearAndDeletedFalse(UUID projectId, int month, int year);

    Optional<TimesheetT13Cell> findByProjectIdAndEmployeeIdAndMonthAndYearAndDayAndDeletedFalse(
            UUID projectId, UUID employeeId, int month, int year, int day);
}
