package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskStageRepository extends JpaRepository<TaskStage, UUID> {

    List<TaskStage> findByProjectIdAndDeletedFalseOrderBySequenceAsc(UUID projectId);

    Optional<TaskStage> findByProjectIdAndIsDefaultTrueAndDeletedFalse(UUID projectId);

    boolean existsByProjectIdAndNameAndDeletedFalse(UUID projectId, String name);
}
