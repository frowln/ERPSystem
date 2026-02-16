package com.privod.platform.modules.chatter.repository;

import com.privod.platform.modules.chatter.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    Page<Comment> findByEntityTypeAndEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);

    Page<Comment> findByEntityTypeAndEntityIdAndIsInternalAndDeletedFalse(
            String entityType, UUID entityId, boolean isInternal, Pageable pageable);

    Page<Comment> findByParentCommentIdAndDeletedFalse(UUID parentCommentId, Pageable pageable);

    long countByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId);
}
