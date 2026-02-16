package com.privod.platform.modules.maintenance.repository;

import com.privod.platform.modules.maintenance.domain.PreventiveSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PreventiveScheduleRepository extends JpaRepository<PreventiveSchedule, UUID>,
        JpaSpecificationExecutor<PreventiveSchedule> {

    Page<PreventiveSchedule> findByEquipmentIdAndDeletedFalse(UUID equipmentId, Pageable pageable);

    Page<PreventiveSchedule> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    @Query("SELECT s FROM PreventiveSchedule s WHERE s.deleted = false " +
            "AND s.isActive = true AND s.nextExecution <= :date")
    List<PreventiveSchedule> findDueSchedules(@Param("date") LocalDate date);

    @Query("SELECT s FROM PreventiveSchedule s WHERE s.deleted = false " +
            "AND s.isActive = true AND s.nextExecution BETWEEN :from AND :to")
    List<PreventiveSchedule> findUpcomingSchedules(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
