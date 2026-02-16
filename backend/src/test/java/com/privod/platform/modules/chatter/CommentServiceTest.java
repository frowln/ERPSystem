package com.privod.platform.modules.chatter;

import com.privod.platform.modules.chatter.domain.Comment;
import com.privod.platform.modules.chatter.repository.CommentRepository;
import com.privod.platform.modules.chatter.service.CommentService;
import com.privod.platform.modules.chatter.web.dto.CommentResponse;
import com.privod.platform.modules.chatter.web.dto.CreateCommentRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private CommentService commentService;

    private UUID commentId;
    private UUID entityId;
    private UUID authorId;
    private Comment testComment;

    @BeforeEach
    void setUp() {
        commentId = UUID.randomUUID();
        entityId = UUID.randomUUID();
        authorId = UUID.randomUUID();

        testComment = Comment.builder()
                .entityType("project")
                .entityId(entityId)
                .authorId(authorId)
                .content("Необходимо проверить фундамент перед заливкой")
                .attachmentUrls(List.of())
                .mentionedUserIds(List.of())
                .isInternal(false)
                .build();
        testComment.setId(commentId);
        testComment.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Comment")
    class CreateTests {

        @Test
        @DisplayName("Should create a comment successfully")
        void createComment_Success() {
            CreateCommentRequest request = new CreateCommentRequest(
                    "project", entityId, authorId,
                    "Необходимо проверить фундамент перед заливкой",
                    List.of(), null, List.of(), false
            );

            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CommentResponse response = commentService.create(request);

            assertThat(response.entityType()).isEqualTo("project");
            assertThat(response.entityId()).isEqualTo(entityId);
            assertThat(response.authorId()).isEqualTo(authorId);
            assertThat(response.content()).isEqualTo("Необходимо проверить фундамент перед заливкой");
            assertThat(response.isInternal()).isFalse();
        }

        @Test
        @DisplayName("Should create internal comment")
        void createComment_Internal() {
            CreateCommentRequest request = new CreateCommentRequest(
                    "contract", entityId, authorId,
                    "Внутренний комментарий для команды",
                    null, null, null, true
            );

            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CommentResponse response = commentService.create(request);

            assertThat(response.isInternal()).isTrue();
            assertThat(response.entityType()).isEqualTo("contract");
        }

        @Test
        @DisplayName("Should create a threaded reply")
        void createComment_Reply() {
            UUID parentId = UUID.randomUUID();
            CreateCommentRequest request = new CreateCommentRequest(
                    "project", entityId, authorId,
                    "Ответ на комментарий",
                    List.of(), parentId, List.of(), false
            );

            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
                Comment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CommentResponse response = commentService.create(request);

            assertThat(response.parentCommentId()).isEqualTo(parentId);
        }
    }

    @Nested
    @DisplayName("Get Comments")
    class GetTests {

        @Test
        @DisplayName("Should list comments for an entity")
        void getComments_Success() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Comment> page = new PageImpl<>(List.of(testComment));

            when(commentRepository.findByEntityTypeAndEntityIdAndDeletedFalse(
                    eq("project"), eq(entityId), any(Pageable.class))).thenReturn(page);

            Page<CommentResponse> result = commentService.getComments("project", entityId, null, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).entityType()).isEqualTo("project");
        }

        @Test
        @DisplayName("Should return comment count for entity")
        void getCount_Success() {
            when(commentRepository.countByEntityTypeAndEntityIdAndDeletedFalse("project", entityId))
                    .thenReturn(5L);

            long count = commentService.getCount("project", entityId);

            assertThat(count).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("Delete Comment")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete a comment")
        void deleteComment_Success() {
            when(commentRepository.findById(commentId)).thenReturn(Optional.of(testComment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

            commentService.delete(commentId);

            verify(commentRepository).save(any(Comment.class));
        }

        @Test
        @DisplayName("Should throw when comment not found for deletion")
        void deleteComment_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(commentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> commentService.delete(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Комментарий не найден");
        }
    }
}
