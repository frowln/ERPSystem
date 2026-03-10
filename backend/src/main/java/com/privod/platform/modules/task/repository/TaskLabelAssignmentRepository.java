package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskLabelAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskLabelAssignmentRepository extends JpaRepository<TaskLabelAssignment, UUID> {
    List<TaskLabelAssignment> findByTaskId(UUID taskId);
    List<TaskLabelAssignment> findByLabelId(UUID labelId);
    Optional<TaskLabelAssignment> findByTaskIdAndLabelId(UUID taskId, UUID labelId);
    boolean existsByTaskIdAndLabelId(UUID taskId, UUID labelId);
    void deleteByTaskIdAndLabelId(UUID taskId, UUID labelId);
}
