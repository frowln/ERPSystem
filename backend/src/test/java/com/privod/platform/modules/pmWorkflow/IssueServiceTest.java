package com.privod.platform.modules.pmWorkflow;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pmWorkflow.domain.Issue;
import com.privod.platform.modules.pmWorkflow.domain.IssueComment;
import com.privod.platform.modules.pmWorkflow.domain.IssuePriority;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.domain.IssueType;
import com.privod.platform.modules.pmWorkflow.repository.IssueCommentRepository;
import com.privod.platform.modules.pmWorkflow.repository.IssueRepository;
import com.privod.platform.modules.pmWorkflow.service.IssueService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeIssueStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueCommentRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueCommentResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueResponseDto;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private IssueCommentRepository commentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private IssueService issueService;

    private UUID issueId;
    private UUID projectId;
    private UUID reporterId;
    private Issue testIssue;

    @BeforeEach
    void setUp() {
        issueId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        reporterId = UUID.randomUUID();
        testIssue = Issue.builder()
                .projectId(projectId)
                .number("ISS-00001")
                .title("Трещина в бетоне перекрытия")
                .description("Обнаружена трещина длиной 2м")
                .issueType(IssueType.CONSTRUCTION)
                .status(IssueStatus.OPEN)
                .priority(IssuePriority.HIGH)
                .reportedById(reporterId)
                .build();
        testIssue.setId(issueId);
        testIssue.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Issue")
    class CreateIssueTests {

        @Test
        @DisplayName("Should create issue with OPEN status")
        void createIssue_Success() {
            CreateIssueRequest request = new CreateIssueRequest(
                    projectId, "Трещина в бетоне перекрытия", "Обнаружена трещина длиной 2м",
                    IssueType.CONSTRUCTION, IssuePriority.HIGH, null, reporterId,
                    null, "Секция А, этаж 3", null, null, null, null);

            when(issueRepository.findMaxNumberByProject(eq(projectId), eq("ISS-"))).thenReturn(null);
            when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> {
                Issue issue = inv.getArgument(0);
                issue.setId(UUID.randomUUID());
                issue.setCreatedAt(Instant.now());
                return issue;
            });

            IssueResponseDto response = issueService.createIssue(request);

            assertThat(response.status()).isEqualTo(IssueStatus.OPEN);
            assertThat(response.number()).isEqualTo("ISS-00001");
            assertThat(response.title()).isEqualTo("Трещина в бетоне перекрытия");
            assertThat(response.priority()).isEqualTo(IssuePriority.HIGH);
            assertThat(response.issueType()).isEqualTo(IssueType.CONSTRUCTION);
            verify(auditService).logCreate(eq("Issue"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition OPEN -> IN_PROGRESS")
        void changeStatus_OpenToInProgress() {
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));
            when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeIssueStatusRequest request = new ChangeIssueStatusRequest(IssueStatus.IN_PROGRESS, null);
            IssueResponseDto response = issueService.changeStatus(issueId, request);

            assertThat(response.status()).isEqualTo(IssueStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("Issue", issueId, "OPEN", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should reject invalid transition OPEN -> RESOLVED")
        void changeStatus_InvalidTransition_OpenToResolved() {
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));

            ChangeIssueStatusRequest request = new ChangeIssueStatusRequest(IssueStatus.RESOLVED, null);

            assertThatThrownBy(() -> issueService.changeStatus(issueId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести проблему");
        }

        @Test
        @DisplayName("Should set resolvedDate and resolvedById when transitioning to RESOLVED")
        void changeStatus_SetsResolvedFields() {
            UUID resolverId = UUID.randomUUID();
            testIssue.setStatus(IssueStatus.IN_PROGRESS);
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));
            when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeIssueStatusRequest request = new ChangeIssueStatusRequest(IssueStatus.RESOLVED, resolverId);
            IssueResponseDto response = issueService.changeStatus(issueId, request);

            assertThat(response.status()).isEqualTo(IssueStatus.RESOLVED);
            assertThat(response.resolvedDate()).isNotNull();
            assertThat(response.resolvedById()).isEqualTo(resolverId);
        }

        @Test
        @DisplayName("Should allow reopening a CLOSED issue")
        void changeStatus_ClosedToReopened() {
            testIssue.setStatus(IssueStatus.CLOSED);
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));
            when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeIssueStatusRequest request = new ChangeIssueStatusRequest(IssueStatus.REOPENED, null);
            IssueResponseDto response = issueService.changeStatus(issueId, request);

            assertThat(response.status()).isEqualTo(IssueStatus.REOPENED);
        }
    }

    @Nested
    @DisplayName("Issue Comments")
    class IssueCommentTests {

        @Test
        @DisplayName("Should add comment to issue")
        void addComment_Success() {
            UUID authorId = UUID.randomUUID();
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));
            when(commentRepository.save(any(IssueComment.class))).thenAnswer(inv -> {
                IssueComment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateIssueCommentRequest request = new CreateIssueCommentRequest(
                    issueId, authorId, "Необходимо провести экспертизу", null);

            IssueCommentResponseDto response = issueService.addComment(request);

            assertThat(response.issueId()).isEqualTo(issueId);
            assertThat(response.commentText()).isEqualTo("Необходимо провести экспертизу");
            verify(auditService).logCreate(eq("IssueComment"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get and Delete Issue")
    class GetDeleteTests {

        @Test
        @DisplayName("Should throw EntityNotFoundException for missing issue")
        void getIssue_NotFound() {
            UUID missingId = UUID.randomUUID();
            when(issueRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> issueService.getIssue(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Проблема не найдена");
        }

        @Test
        @DisplayName("Should soft-delete issue")
        void deleteIssue_Success() {
            when(issueRepository.findById(issueId)).thenReturn(Optional.of(testIssue));
            when(issueRepository.save(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));

            issueService.deleteIssue(issueId);

            assertThat(testIssue.isDeleted()).isTrue();
            verify(auditService).logDelete("Issue", issueId);
        }
    }
}
