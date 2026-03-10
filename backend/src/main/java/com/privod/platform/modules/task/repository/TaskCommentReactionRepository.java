package com.privod.platform.modules.task.repository;

import com.privod.platform.modules.task.domain.TaskCommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskCommentReactionRepository extends JpaRepository<TaskCommentReaction, UUID> {

    List<TaskCommentReaction> findByCommentId(UUID commentId);

    List<TaskCommentReaction> findByCommentIdIn(List<UUID> commentIds);

    Optional<TaskCommentReaction> findByCommentIdAndUserIdAndEmoji(UUID commentId, UUID userId, String emoji);

    void deleteByCommentId(UUID commentId);
}
