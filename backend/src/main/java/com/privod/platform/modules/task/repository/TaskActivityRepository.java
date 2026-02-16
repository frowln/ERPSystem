package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskActivity;
import com.privod.platform.modules.task.domain.TaskActivityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskActivityRepository extends JpaRepository<TaskActivity, UUID> {

    List<TaskActivity> findByTaskIdAndDeletedFalseOrderByCreatedAtDesc(UUID taskId);

    List<TaskActivity> findByUserIdAndStatusAndDeletedFalse(UUID userId, TaskActivityStatus status);

    @Query("SELECT a FROM TaskActivity a WHERE a.deleted = false AND a.dueDate < :today " +
            "AND a.status NOT IN ('DONE', 'CANCELLED')")
    List<TaskActivity> findOverdueActivities(@Param("today") LocalDate today);

    @Query("SELECT a FROM TaskActivity a WHERE a.deleted = false AND a.userId = :userId " +
            "AND a.dueDate = :date AND a.status NOT IN ('DONE', 'CANCELLED')")
    List<TaskActivity> findUserActivitiesDueOn(@Param("userId") UUID userId, @Param("date") LocalDate date);
}
