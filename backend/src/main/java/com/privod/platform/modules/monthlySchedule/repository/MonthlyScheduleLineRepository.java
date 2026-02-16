package com.privod.platform.modules.monthlySchedule.repository;

import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MonthlyScheduleLineRepository extends JpaRepository<MonthlyScheduleLine, UUID> {

    Page<MonthlyScheduleLine> findByScheduleIdAndDeletedFalse(UUID scheduleId, Pageable pageable);

    List<MonthlyScheduleLine> findByScheduleIdAndDeletedFalseOrderByStartDate(UUID scheduleId);

    long countByScheduleIdAndDeletedFalse(UUID scheduleId);
}
