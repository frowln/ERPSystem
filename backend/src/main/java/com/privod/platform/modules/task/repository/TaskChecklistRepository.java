package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskChecklistRepository extends JpaRepository<TaskChecklist, UUID> {

    List<TaskChecklist> findByTaskIdAndDeletedFalseOrderBySortOrderAsc(UUID taskId);

    @Query("SELECT COUNT(c) FROM TaskChecklist c WHERE c.taskId = :taskId AND c.deleted = false AND c.isCompleted = true")
    long countCompletedByTaskId(@Param("taskId") UUID taskId);

    @Query("SELECT COUNT(c) FROM TaskChecklist c WHERE c.taskId = :taskId AND c.deleted = false")
    long countByTaskId(@Param("taskId") UUID taskId);
}
