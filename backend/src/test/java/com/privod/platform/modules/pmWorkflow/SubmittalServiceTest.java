package com.privod.platform.modules.pmWorkflow;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pmWorkflow.domain.Submittal;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalStatus;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalType;
import com.privod.platform.modules.pmWorkflow.repository.SubmittalPackageRepository;
import com.privod.platform.modules.pmWorkflow.repository.SubmittalRepository;
import com.privod.platform.modules.pmWorkflow.repository.SubmittalReviewRepository;
import com.privod.platform.modules.pmWorkflow.service.SubmittalService;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalResponseDto;
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
    private SubmittalPackageRepository packageRepository;

    @Mock
    private SubmittalReviewRepository reviewRepository;

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
                .number("SUB-00001")
                .title("Рабочие чертежи арматуры")
                .submittalType(SubmittalType.SHOP_DRAWING)
                .status(SubmittalStatus.DRAFT)
                .dueDate(LocalDate.now().plusDays(14))
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
                    projectId, "Рабочие чертежи арматуры", "Описание",
                    SubmittalType.SHOP_DRAWING, "03 30 00", LocalDate.now().plusDays(14),
                    null, null, null, null, null, null, null);

            when(submittalRepository.findMaxNumberByProject(eq(projectId), eq("SUB-"))).thenReturn(null);
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> {
                Submittal s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            SubmittalResponseDto response = submittalService.createSubmittal(request);

            assertThat(response.status()).isEqualTo(SubmittalStatus.DRAFT);
            assertThat(response.number()).isEqualTo("SUB-00001");
            assertThat(response.title()).isEqualTo("Рабочие чертежи арматуры");
            verify(auditService).logCreate(eq("Submittal"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition DRAFT -> SUBMITTED and set submittedDate")
        void changeStatus_DraftToSubmitted() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.SUBMITTED, null);
            SubmittalResponseDto response = submittalService.changeStatus(submittalId, request);

            assertThat(response.status()).isEqualTo(SubmittalStatus.SUBMITTED);
            assertThat(response.submittedDate()).isNotNull();
            verify(auditService).logStatusChange("Submittal", submittalId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void changeStatus_InvalidTransition_DraftToApproved() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.APPROVED, null);

            assertThatThrownBy(() -> submittalService.changeStatus(submittalId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести сабмитал");
        }

        @Test
        @DisplayName("Should update ball-in-court on status change")
        void changeStatus_UpdatesBallInCourt() {
            UUID reviewerId = UUID.randomUUID();
            testSubmittal.setStatus(SubmittalStatus.DRAFT);
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeSubmittalStatusRequest request = new ChangeSubmittalStatusRequest(SubmittalStatus.SUBMITTED, reviewerId);
            SubmittalResponseDto response = submittalService.changeStatus(submittalId, request);

            assertThat(response.ballInCourt()).isEqualTo(reviewerId);
        }
    }

    @Nested
    @DisplayName("Ball in Court")
    class BallInCourtTests {

        @Test
        @DisplayName("Should find submittals by ball-in-court user")
        void findByBallInCourt_Success() {
            UUID userId = UUID.randomUUID();
            testSubmittal.setBallInCourt(userId);
            testSubmittal.setStatus(SubmittalStatus.UNDER_REVIEW);

            when(submittalRepository.findByBallInCourt(userId)).thenReturn(List.of(testSubmittal));

            List<SubmittalResponseDto> result = submittalService.findByBallInCourt(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).ballInCourt()).isEqualTo(userId);
        }
    }

    @Nested
    @DisplayName("Delete Submittal")
    class DeleteSubmittalTests {

        @Test
        @DisplayName("Should soft-delete submittal")
        void deleteSubmittal_Success() {
            when(submittalRepository.findById(submittalId)).thenReturn(Optional.of(testSubmittal));
            when(submittalRepository.save(any(Submittal.class))).thenAnswer(inv -> inv.getArgument(0));

            submittalService.deleteSubmittal(submittalId);

            assertThat(testSubmittal.isDeleted()).isTrue();
            verify(auditService).logDelete("Submittal", submittalId);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for missing submittal")
        void deleteSubmittal_NotFound() {
            UUID missingId = UUID.randomUUID();
            when(submittalRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> submittalService.deleteSubmittal(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Сабмитал не найден");
        }
    }
}
