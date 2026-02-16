package com.privod.platform.modules.design.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.design.domain.DesignReview;
import com.privod.platform.modules.design.domain.DesignReviewStatus;
import com.privod.platform.modules.design.domain.DesignSection;
import com.privod.platform.modules.design.domain.DesignVersion;
import com.privod.platform.modules.design.domain.DesignVersionStatus;
import com.privod.platform.modules.design.repository.DesignReviewRepository;
import com.privod.platform.modules.design.repository.DesignSectionRepository;
import com.privod.platform.modules.design.repository.DesignVersionRepository;
import com.privod.platform.modules.design.web.dto.CreateDesignReviewRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignSectionRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignVersionRequest;
import com.privod.platform.modules.design.web.dto.DesignReviewResponse;
import com.privod.platform.modules.design.web.dto.DesignSectionResponse;
import com.privod.platform.modules.design.web.dto.DesignVersionResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DesignServiceTest {

    @Mock
    private DesignVersionRepository versionRepository;

    @Mock
    private DesignReviewRepository reviewRepository;

    @Mock
    private DesignSectionRepository sectionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DesignService designService;

    private UUID versionId;
    private UUID projectId;
    private DesignVersion testVersion;

    @BeforeEach
    void setUp() {
        versionId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testVersion = DesignVersion.builder()
                .projectId(projectId)
                .documentId(UUID.randomUUID())
                .versionNumber("1.0")
                .title("Рабочая документация - АР")
                .discipline("АР")
                .author("Петров А.А.")
                .status(DesignVersionStatus.DRAFT)
                .reviewDeadline(LocalDate.now().plusDays(14))
                .build();
        testVersion.setId(versionId);
        testVersion.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Version")
    class CreateVersionTests {

        @Test
        @DisplayName("Should create version with DRAFT status")
        void shouldCreateVersion_whenValidInput() {
            CreateDesignVersionRequest request = new CreateDesignVersionRequest(
                    projectId, UUID.randomUUID(), "2.0",
                    "Обновлённая рабочая документация", "АР", "Сидоров В.В.",
                    LocalDate.now().plusDays(7), "/files/doc.pdf", 1024000L,
                    "Изменения по замечаниям экспертизы");

            when(versionRepository.save(any(DesignVersion.class))).thenAnswer(inv -> {
                DesignVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            DesignVersionResponse response = designService.createVersion(request);

            assertThat(response.status()).isEqualTo(DesignVersionStatus.DRAFT);
            assertThat(response.versionNumber()).isEqualTo("2.0");
            assertThat(response.title()).isEqualTo("Обновлённая рабочая документация");
            assertThat(response.discipline()).isEqualTo("АР");
            verify(auditService).logCreate(eq("DesignVersion"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when version not found")
        void shouldThrowException_whenVersionNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(versionRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> designService.getVersion(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Версия проектной документации не найдена");
        }
    }

    @Nested
    @DisplayName("Version Status Transitions")
    class VersionStatusTransitionTests {

        @Test
        @DisplayName("Should allow valid transition DRAFT -> IN_REVIEW")
        void shouldTransitionDraftToInReview() {
            when(versionRepository.findById(versionId)).thenReturn(Optional.of(testVersion));
            when(versionRepository.save(any(DesignVersion.class))).thenAnswer(inv -> inv.getArgument(0));

            DesignVersionResponse response = designService.transitionVersionStatus(versionId, DesignVersionStatus.IN_REVIEW);

            assertThat(response.status()).isEqualTo(DesignVersionStatus.IN_REVIEW);
            verify(auditService).logStatusChange("DesignVersion", versionId, "DRAFT", "IN_REVIEW");
        }

        @Test
        @DisplayName("Should allow valid transition IN_REVIEW -> APPROVED")
        void shouldTransitionInReviewToApproved() {
            testVersion.setStatus(DesignVersionStatus.IN_REVIEW);
            when(versionRepository.findById(versionId)).thenReturn(Optional.of(testVersion));
            when(versionRepository.save(any(DesignVersion.class))).thenAnswer(inv -> inv.getArgument(0));

            DesignVersionResponse response = designService.transitionVersionStatus(versionId, DesignVersionStatus.APPROVED);

            assertThat(response.status()).isEqualTo(DesignVersionStatus.APPROVED);
            verify(auditService).logStatusChange("DesignVersion", versionId, "IN_REVIEW", "APPROVED");
        }

        @Test
        @DisplayName("Should reject invalid transition DRAFT -> APPROVED")
        void shouldThrowException_whenInvalidTransition() {
            when(versionRepository.findById(versionId)).thenReturn(Optional.of(testVersion));

            assertThatThrownBy(() -> designService.transitionVersionStatus(versionId, DesignVersionStatus.APPROVED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести версию из статуса");
        }

        @Test
        @DisplayName("Should reject transition from terminal ARCHIVED status")
        void shouldThrowException_whenTransitionFromArchived() {
            testVersion.setStatus(DesignVersionStatus.ARCHIVED);
            when(versionRepository.findById(versionId)).thenReturn(Optional.of(testVersion));

            assertThatThrownBy(() -> designService.transitionVersionStatus(versionId, DesignVersionStatus.DRAFT))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести версию из статуса");
        }
    }

    @Nested
    @DisplayName("Create Review")
    class CreateReviewTests {

        @Test
        @DisplayName("Should create review with PENDING status")
        void shouldCreateReview_whenVersionExists() {
            UUID reviewerId = UUID.randomUUID();
            CreateDesignReviewRequest request = new CreateDesignReviewRequest(
                    versionId, reviewerId, "Козлов К.К.", "Прошу рассмотреть");

            when(versionRepository.findById(versionId)).thenReturn(Optional.of(testVersion));
            when(reviewRepository.save(any(DesignReview.class))).thenAnswer(inv -> {
                DesignReview r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            DesignReviewResponse response = designService.createReview(request);

            assertThat(response.status()).isEqualTo(DesignReviewStatus.PENDING);
            assertThat(response.reviewerName()).isEqualTo("Козлов К.К.");
            assertThat(response.designVersionId()).isEqualTo(versionId);
            verify(auditService).logCreate(eq("DesignReview"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when creating review for non-existent version")
        void shouldThrowException_whenVersionNotFound() {
            UUID nonExistentVersionId = UUID.randomUUID();
            CreateDesignReviewRequest request = new CreateDesignReviewRequest(
                    nonExistentVersionId, UUID.randomUUID(), "Name", null);

            when(versionRepository.findById(nonExistentVersionId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> designService.createReview(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Версия проектной документации не найдена");
        }
    }

    @Nested
    @DisplayName("Complete Review")
    class CompleteReviewTests {

        @Test
        @DisplayName("Should complete review with APPROVED status")
        void shouldCompleteReview_whenPending() {
            UUID reviewId = UUID.randomUUID();
            DesignReview review = DesignReview.builder()
                    .designVersionId(versionId)
                    .reviewerId(UUID.randomUUID())
                    .reviewerName("Козлов К.К.")
                    .status(DesignReviewStatus.PENDING)
                    .build();
            review.setId(reviewId);
            review.setCreatedAt(Instant.now());

            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
            when(reviewRepository.save(any(DesignReview.class))).thenAnswer(inv -> inv.getArgument(0));

            DesignReviewResponse response = designService.completeReview(
                    reviewId, DesignReviewStatus.APPROVED, "Замечаний нет");

            assertThat(response.status()).isEqualTo(DesignReviewStatus.APPROVED);
            assertThat(response.comments()).isEqualTo("Замечаний нет");
            assertThat(response.reviewedAt()).isNotNull();
            verify(auditService).logStatusChange("DesignReview", reviewId, "PENDING", "APPROVED");
        }

        @Test
        @DisplayName("Should throw when completing already finished review")
        void shouldThrowException_whenReviewAlreadyCompleted() {
            UUID reviewId = UUID.randomUUID();
            DesignReview review = DesignReview.builder()
                    .designVersionId(versionId)
                    .reviewerId(UUID.randomUUID())
                    .status(DesignReviewStatus.APPROVED)
                    .build();
            review.setId(reviewId);

            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> designService.completeReview(
                    reviewId, DesignReviewStatus.REJECTED, "comment"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Рецензия уже завершена");
        }
    }

    @Nested
    @DisplayName("Create Section")
    class CreateSectionTests {

        @Test
        @DisplayName("Should create root section without parent")
        void shouldCreateRootSection_whenNoParent() {
            CreateDesignSectionRequest request = new CreateDesignSectionRequest(
                    projectId, "Архитектурные решения", "АР",
                    "Архитектура", null, 1, "Основной раздел");

            when(sectionRepository.save(any(DesignSection.class))).thenAnswer(inv -> {
                DesignSection s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            DesignSectionResponse response = designService.createSection(request);

            assertThat(response.name()).isEqualTo("Архитектурные решения");
            assertThat(response.code()).isEqualTo("АР");
            assertThat(response.parentId()).isNull();
            assertThat(response.sequence()).isEqualTo(1);
            verify(auditService).logCreate(eq("DesignSection"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create child section with parent ID")
        void shouldCreateChildSection_whenParentProvided() {
            UUID parentId = UUID.randomUUID();
            CreateDesignSectionRequest request = new CreateDesignSectionRequest(
                    projectId, "Подраздел АР.1", "АР.1",
                    "Архитектура", parentId, 1, "Подраздел");

            when(sectionRepository.save(any(DesignSection.class))).thenAnswer(inv -> {
                DesignSection s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            DesignSectionResponse response = designService.createSection(request);

            assertThat(response.parentId()).isEqualTo(parentId);
            assertThat(response.code()).isEqualTo("АР.1");
        }

        @Test
        @DisplayName("Should default sequence to 0 when null")
        void shouldDefaultSequence_whenNull() {
            CreateDesignSectionRequest request = new CreateDesignSectionRequest(
                    projectId, "Раздел", "КР", "Конструктив",
                    null, null, null);

            when(sectionRepository.save(any(DesignSection.class))).thenAnswer(inv -> {
                DesignSection s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            DesignSectionResponse response = designService.createSection(request);

            assertThat(response.sequence()).isZero();
        }
    }
}
