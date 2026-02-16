package com.privod.platform.modules.pto;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalComment;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.domain.SubmittalType;
import com.privod.platform.modules.pto.repository.SubmittalCommentRepository;
import com.privod.platform.modules.pto.repository.SubmittalRepository;
import com.privod.platform.modules.pto.service.PtoCodeGenerator;
import com.privod.platform.modules.pto.service.SubmittalService;
import com.privod.platform.modules.pto.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalCommentRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pto.web.dto.SubmittalCommentResponse;
import com.privod.platform.modules.pto.web.dto.SubmittalResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
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
class SubmittalServiceTest {

    @Mock
    private SubmittalRepository submittalRepository;

    @Mock
    private SubmittalCommentRepository commentRepository;

    @Mock
    private PtoCodeGenerator codeGenerator;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SubmittalService submittalService;

    private UUID submittalId;
    private UUID projectId;
    private Submittal testSubmittal;

    @BeforeEach
    void setUp() {
        submittalId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testSubmittal = Submittal.builder()
                .projectId(projectId)
                .code("SUB-20260213-00001")
                .title("Рабочий чертёж фундамента")
                .submittalType(SubmittalType.SHOP_DRAWING)
                .description("Чертежи для согласования")
                .status(SubmittalStatus.DRAFT)
                .dueDate(LocalDate.of(2026, 3, 1))
                .build();
        testSubmittal.setId(submittalId);
        testSubmittal.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Submittal")
    class CreateSubmittalTests {

        @Test
        @DisplayName("Should create submittal with DRAFT status")
        void createSubmittal_Success() {
            CreateSubmittalRequest request = new CreateSubmittalRequest(
                    projectId, "Рабочий чертёж фундамента",
                    SubmittalType.SHOP_DRAWING, "Описание",
                    null, LocalDate.of(2026, 3, 1));

            when(codeGenerator.generateSubmittalCode()).thenReturn("SUB-20260213-00001");
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> {
                Submittal s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SubmittalResponse response = submittalService.createSubmittal(request);

            assertThat(response.status()).isEqualTo(SubmittalStatus.DRAFT);
            assertThat(response.code()).isEqualTo("SUB-20260213-00001");
            assertThat(response.submittalType()).isEqualTo(SubmittalType.SHOP_DRAWING);
            assertThat(response.title()).isEqualTo("Рабочий чертёж фундамента");
            verify(auditService).logCreate(eq("Submittal"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Change Submittal Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should transition from DRAFT to SUBMITTED")
        void changeStatus_DraftToSubmitted() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.SUBMITTED);
            SubmittalResponse response = submittalService.changeStatus(submittalId, request);

            assertThat(response.status()).isEqualTo(SubmittalStatus.SUBMITTED);
            verify(auditService).logStatusChange("Submittal", submittalId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should set responseDate when approving")
        void changeStatus_SetsResponseDateOnApproval() {
            testSubmittal.setStatus(SubmittalStatus.SUBMITTED);
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.APPROVED);
            SubmittalResponse response = submittalService.changeStatus(submittalId, request);

            assertThat(response.status()).isEqualTo(SubmittalStatus.APPROVED);
            assertThat(response.responseDate()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void changeStatus_InvalidTransition() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.APPROVED);

            assertThatThrownBy(() -> submittalService.changeStatus(submittalId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести передачу");
        }
    }

    @Nested
    @DisplayName("Submittal Comments")
    class CommentTests {

        @Test
        @DisplayName("Should add comment to submittal")
        void addComment_Success() {
            UUID authorId = UUID.randomUUID();
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(commentRepository.save(any(SubmittalComment.class))).thenAnswer(inv -> {
                SubmittalComment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateSubmittalCommentRequest request = new CreateSubmittalCommentRequest(
                    authorId, "Необходимо доработать узел А", null);

            SubmittalCommentResponse response = submittalService.addComment(submittalId, request);

            assertThat(response.content()).isEqualTo("Необходимо доработать узел А");
            assertThat(response.submittalId()).isEqualTo(submittalId);
            assertThat(response.authorId()).isEqualTo(authorId);
            verify(auditService).logCreate(eq("SubmittalComment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should return comments for submittal")
        void getComments_Success() {
            SubmittalComment comment = SubmittalComment.builder()
                    .submittalId(submittalId)
                    .authorId(UUID.randomUUID())
                    .content("Замечание по чертежу")
                    .build();
            comment.setId(UUID.randomUUID());
            comment.setCreatedAt(Instant.now());

            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(commentRepository.findBySubmittalIdAndDeletedFalseOrderByCreatedAtDesc(submittalId))
                    .thenReturn(List.of(comment));

            List<SubmittalCommentResponse> comments = submittalService.getComments(submittalId);

            assertThat(comments).hasSize(1);
            assertThat(comments.get(0).content()).isEqualTo("Замечание по чертежу");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when adding comment to missing submittal")
        void addComment_SubmittalNotFound() {
            UUID missingId = UUID.randomUUID();
            when(submittalRepository.findById(missingId)).thenReturn(Optional.empty());

            CreateSubmittalCommentRequest request = new CreateSubmittalCommentRequest(
                    UUID.randomUUID(), "Комментарий", null);

            assertThatThrownBy(() -> submittalService.addComment(missingId, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Передача документации не найдена");
        }
    }

    @Nested
    @DisplayName("Delete Submittal")
    class DeleteTests {

        @Test
        @DisplayName("Should soft-delete submittal")
        void deleteSubmittal_Success() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            submittalService.deleteSubmittal(submittalId);

            assertThat(testSubmittal.isDeleted()).isTrue();
            verify(auditService).logDelete("Submittal", submittalId);
        }
    }
}
