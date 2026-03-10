package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.ParticipantRole;
import com.privod.platform.modules.task.domain.TaskParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface TaskParticipantRepository extends JpaRepository<TaskParticipant, UUID> {

    List<TaskParticipant> findByTaskId(UUID taskId);

    List<TaskParticipant> findByTaskIdAndRole(UUID taskId, ParticipantRole role);

    List<TaskParticipant> findByUserId(UUID userId);

    Optional<TaskParticipant> findByTaskIdAndUserIdAndRole(UUID taskId, UUID userId, ParticipantRole role);

    boolean existsByTaskIdAndUserId(UUID taskId, UUID userId);

    boolean existsByTaskIdAndUserIdAndRole(UUID taskId, UUID userId, ParticipantRole role);

    void deleteByTaskIdAndUserIdAndRole(UUID taskId, UUID userId, ParticipantRole role);

    void deleteByTaskId(UUID taskId);

    @Query("SELECT DISTINCT tp.taskId FROM TaskParticipant tp WHERE tp.userId = :userId")
    Set<UUID> findTaskIdsByUserId(UUID userId);

    @Query("SELECT tp FROM TaskParticipant tp WHERE tp.taskId IN :taskIds")
    List<TaskParticipant> findByTaskIdIn(Set<UUID> taskIds);

    long countByTaskId(UUID taskId);
}
