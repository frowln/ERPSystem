package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

    List<TaskComment> findByTaskIdAndDeletedFalseOrderByCreatedAtAsc(UUID taskId);
}
