package com.privod.platform.modules.monthlySchedule.repository;

import com.privod.platform.modules.monthlySchedule.domain.MonthlySchedule;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonthlyScheduleRepository extends JpaRepository<MonthlySchedule, UUID>,
        JpaSpecificationExecutor<MonthlySchedule> {

    Page<MonthlySchedule> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<MonthlySchedule> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, MonthlyScheduleStatus status, Pageable pageable);

    Page<MonthlySchedule> findByDeletedFalse(Pageable pageable);

    Optional<MonthlySchedule> findByProjectIdAndYearAndMonthAndDeletedFalse(UUID projectId, Integer year, Integer month);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
