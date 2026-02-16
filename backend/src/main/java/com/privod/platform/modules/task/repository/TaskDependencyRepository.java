package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
