package com.privod.platform.modules.chatter.service;

import com.privod.platform.modules.chatter.domain.Comment;
import com.privod.platform.modules.chatter.repository.CommentRepository;
import com.privod.platform.modules.chatter.web.dto.CommentResponse;
import com.privod.platform.modules.chatter.web.dto.CreateCommentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;

    @Transactional
    public CommentResponse create(CreateCommentRequest request) {
        Comment comment = Comment.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .authorId(request.authorId())
                .content(request.content())
                .attachmentUrls(request.attachmentUrls() != null ? request.attachmentUrls() : List.of())
                .parentCommentId(request.parentCommentId())
                .mentionedUserIds(request.mentionedUserIds() != null ? request.mentionedUserIds() : List.of())
                .isInternal(request.isInternal())
                .build();

        comment = commentRepository.save(comment);
        log.info("Comment created for {} {}: {}", request.entityType(), request.entityId(), comment.getId());
        return CommentResponse.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(String entityType, UUID entityId,
                                              Boolean isInternal, Pageable pageable) {
        if (isInternal != null) {
            return commentRepository
                    .findByEntityTypeAndEntityIdAndIsInternalAndDeletedFalse(
                            entityType, entityId, isInternal, pageable)
                    .map(CommentResponse::fromEntity);
        }
        return commentRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId, pageable)
                .map(CommentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getReplies(UUID parentCommentId, Pageable pageable) {
        return commentRepository
                .findByParentCommentIdAndDeletedFalse(parentCommentId, pageable)
                .map(CommentResponse::fromEntity);
    }

    @Transactional
    public CommentResponse update(UUID commentId, String content) {
        Comment comment = getCommentOrThrow(commentId);
        comment.setContent(content);
        comment = commentRepository.save(comment);
        log.info("Comment updated: {}", commentId);
        return CommentResponse.fromEntity(comment);
    }

    @Transactional
    public void delete(UUID commentId) {
        Comment comment = getCommentOrThrow(commentId);
        comment.softDelete();
        commentRepository.save(comment);
        log.info("Comment deleted: {}", commentId);
    }

    @Transactional(readOnly = true)
    public long getCount(String entityType, UUID entityId) {
        return commentRepository.countByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId);
    }

    private Comment getCommentOrThrow(UUID id) {
        return commentRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Комментарий не найден: " + id));
    }
}
