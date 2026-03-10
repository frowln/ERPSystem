package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, UUID> {

    List<TaskDependency> findByTaskId(UUID taskId);

    List<TaskDependency> findByDependsOnTaskId(UUID dependsOnTaskId);

    Optional<TaskDependency> findByTaskIdAndDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    boolean existsByTaskIdAndDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    List<TaskDependency> findByTaskIdOrDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    List<TaskDependency> findByTaskIdIn(List<UUID> taskIds);

    @Query("SELECT d FROM TaskDependency d WHERE d.taskId IN " +
            "(SELECT t.id FROM ProjectTask t WHERE t.projectId = :projectId AND t.deleted = false)")
    List<TaskDependency> findAllByProjectId(@Param("projectId") UUID projectId);
}
