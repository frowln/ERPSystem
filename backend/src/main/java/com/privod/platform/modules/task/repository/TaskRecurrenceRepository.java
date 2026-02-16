package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskRecurrence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRecurrenceRepository extends JpaRepository<TaskRecurrence, UUID> {

    Optional<TaskRecurrence> findByTaskIdAndDeletedFalse(UUID taskId);

    @Query("SELECT r FROM TaskRecurrence r WHERE r.deleted = false AND r.isActive = true " +
            "AND r.nextOccurrence <= :today AND (r.endDate IS NULL OR r.endDate >= :today)")
    List<TaskRecurrence> findDueRecurrences(@Param("today") LocalDate today);

    List<TaskRecurrence> findByDeletedFalseAndIsActiveTrue();
}
