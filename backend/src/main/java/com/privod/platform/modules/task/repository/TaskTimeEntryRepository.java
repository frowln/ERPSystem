package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskTimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskTimeEntryRepository extends JpaRepository<TaskTimeEntry, UUID> {
    List<TaskTimeEntry> findByTaskIdOrderByStartedAtDesc(UUID taskId);
    List<TaskTimeEntry> findByUserIdOrderByStartedAtDesc(UUID userId);
    Optional<TaskTimeEntry> findByTaskIdAndUserIdAndIsRunningTrue(UUID taskId, UUID userId);
    List<TaskTimeEntry> findByUserIdAndIsRunningTrue(UUID userId);

    @Query("SELECT COALESCE(SUM(t.durationSeconds), 0) FROM TaskTimeEntry t WHERE t.taskId = :taskId")
    long sumDurationByTaskId(@Param("taskId") UUID taskId);
}
