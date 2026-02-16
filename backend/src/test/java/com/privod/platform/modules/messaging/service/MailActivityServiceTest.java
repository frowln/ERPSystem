package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.ActivityCategory;
import com.privod.platform.modules.messaging.domain.ActivityDelayUnit;
import com.privod.platform.modules.messaging.domain.MailActivity;
import com.privod.platform.modules.messaging.domain.MailActivityStatus;
import com.privod.platform.modules.messaging.domain.MailActivityType;
import com.privod.platform.modules.messaging.repository.MailActivityRepository;
import com.privod.platform.modules.messaging.repository.MailActivityTypeRepository;
import com.privod.platform.modules.messaging.web.dto.MailActivityResponse;
import com.privod.platform.modules.messaging.web.dto.ScheduleActivityRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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
class MailActivityServiceTest {

    @Mock
    private MailActivityRepository mailActivityRepository;

    @Mock
    private MailActivityTypeRepository mailActivityTypeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MailActivityService mailActivityService;

    private UUID userId;
    private UUID activityTypeId;
    private UUID assignedUserId;
    private User currentUser;
    private MailActivityType testActivityType;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        activityTypeId = UUID.randomUUID();
        assignedUserId = UUID.randomUUID();

        currentUser = User.builder()
                .email("user@privod.ru")
                .passwordHash("hash")
                .firstName("Иван")
                .lastName("Иванов")
                .build();
        currentUser.setId(userId);

        testActivityType = MailActivityType.builder()
                .name("Задача")
                .category(ActivityCategory.DEFAULT)
                .delayCount(0)
                .delayUnit(ActivityDelayUnit.DAYS)
                .build();
        testActivityType.setId(activityTypeId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setUpSecurityContext() {
        CustomUserDetails userDetails = new CustomUserDetails(currentUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("Schedule Activity")
    class ScheduleActivityTests {

        @Test
        @DisplayName("Should schedule activity with PLANNED status")
        void shouldScheduleActivity_whenValidInput() {
            setUpSecurityContext();

            ScheduleActivityRequest request = new ScheduleActivityRequest(
                    "Project", UUID.randomUUID(), activityTypeId,
                    assignedUserId, "Проверить документы", "Важная проверка",
                    LocalDate.now().plusDays(3));

            when(userRepository.findByEmail("user@privod.ru")).thenReturn(Optional.of(currentUser));
            when(mailActivityTypeRepository.findById(activityTypeId)).thenReturn(Optional.of(testActivityType));
            when(mailActivityRepository.save(any(MailActivity.class))).thenAnswer(inv -> {
                MailActivity a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            MailActivityResponse response = mailActivityService.scheduleActivity(request);

            assertThat(response.status()).isEqualTo(MailActivityStatus.PLANNED);
            assertThat(response.summary()).isEqualTo("Проверить документы");
            assertThat(response.assignedUserId()).isEqualTo(assignedUserId);
            assertThat(response.userId()).isEqualTo(userId);
            verify(auditService).logCreate(eq("MailActivity"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when activity type not found")
        void shouldThrowException_whenActivityTypeNotFound() {
            setUpSecurityContext();

            UUID nonExistentTypeId = UUID.randomUUID();
            ScheduleActivityRequest request = new ScheduleActivityRequest(
                    "Project", UUID.randomUUID(), nonExistentTypeId,
                    assignedUserId, "summary", null, LocalDate.now().plusDays(1));

            when(userRepository.findByEmail("user@privod.ru")).thenReturn(Optional.of(currentUser));
            when(mailActivityTypeRepository.findById(nonExistentTypeId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mailActivityService.scheduleActivity(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Тип активности не найден");
        }

        @Test
        @DisplayName("Should throw when user is not authenticated")
        void shouldThrowException_whenNotAuthenticated() {
            SecurityContextHolder.clearContext();

            ScheduleActivityRequest request = new ScheduleActivityRequest(
                    "Project", UUID.randomUUID(), activityTypeId,
                    assignedUserId, "summary", null, LocalDate.now());

            assertThatThrownBy(() -> mailActivityService.scheduleActivity(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Пользователь не аутентифицирован");
        }
    }

    @Nested
    @DisplayName("Complete Activity")
    class CompleteActivityTests {

        @Test
        @DisplayName("Should complete activity and mark as DONE")
        void shouldCompleteActivity_whenPlanned() {
            UUID activityId = UUID.randomUUID();
            MailActivity activity = MailActivity.builder()
                    .modelName("Project")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(assignedUserId)
                    .summary("Задача")
                    .dueDate(LocalDate.now().plusDays(1))
                    .status(MailActivityStatus.PLANNED)
                    .build();
            activity.setId(activityId);
            activity.setCreatedAt(Instant.now());

            when(mailActivityRepository.findById(activityId)).thenReturn(Optional.of(activity));
            when(mailActivityRepository.save(any(MailActivity.class))).thenAnswer(inv -> inv.getArgument(0));

            MailActivityResponse response = mailActivityService.completeActivity(activityId);

            assertThat(response.status()).isEqualTo(MailActivityStatus.DONE);
            assertThat(response.completedAt()).isNotNull();
            verify(auditService).logUpdate("MailActivity", activityId, "status", "PLANNED", "DONE");
        }

        @Test
        @DisplayName("Should throw when activity not found")
        void shouldThrowException_whenActivityNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(mailActivityRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mailActivityService.completeActivity(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Активность не найдена");
        }

        @Test
        @DisplayName("Should throw when completing deleted activity")
        void shouldThrowException_whenActivityDeleted() {
            UUID activityId = UUID.randomUUID();
            MailActivity activity = MailActivity.builder()
                    .modelName("Project")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(assignedUserId)
                    .summary("Удалённая задача")
                    .dueDate(LocalDate.now())
                    .status(MailActivityStatus.PLANNED)
                    .build();
            activity.setId(activityId);
            activity.setDeleted(true);

            when(mailActivityRepository.findById(activityId)).thenReturn(Optional.of(activity));

            assertThatThrownBy(() -> mailActivityService.completeActivity(activityId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Активность удалена");
        }
    }

    @Nested
    @DisplayName("Cancel Activity")
    class CancelActivityTests {

        @Test
        @DisplayName("Should cancel activity and set status to CANCELLED")
        void shouldCancelActivity_whenExists() {
            UUID activityId = UUID.randomUUID();
            MailActivity activity = MailActivity.builder()
                    .modelName("Contract")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(assignedUserId)
                    .summary("Отменяемая задача")
                    .dueDate(LocalDate.now().plusDays(5))
                    .status(MailActivityStatus.PLANNED)
                    .build();
            activity.setId(activityId);
            activity.setCreatedAt(Instant.now());

            when(mailActivityRepository.findById(activityId)).thenReturn(Optional.of(activity));
            when(mailActivityRepository.save(any(MailActivity.class))).thenAnswer(inv -> inv.getArgument(0));

            MailActivityResponse response = mailActivityService.cancelActivity(activityId);

            assertThat(response.status()).isEqualTo(MailActivityStatus.CANCELLED);
            verify(auditService).logUpdate("MailActivity", activityId, "status", "PLANNED", "CANCELLED");
        }

        @Test
        @DisplayName("Should throw when cancelling deleted activity")
        void shouldThrowException_whenCancellingDeletedActivity() {
            UUID activityId = UUID.randomUUID();
            MailActivity activity = MailActivity.builder()
                    .modelName("Contract")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(assignedUserId)
                    .summary("task")
                    .dueDate(LocalDate.now())
                    .status(MailActivityStatus.PLANNED)
                    .build();
            activity.setId(activityId);
            activity.setDeleted(true);

            when(mailActivityRepository.findById(activityId)).thenReturn(Optional.of(activity));

            assertThatThrownBy(() -> mailActivityService.cancelActivity(activityId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Активность удалена");
        }
    }

    @Nested
    @DisplayName("Find Overdue Activities")
    class OverdueActivitiesTests {

        @Test
        @DisplayName("Should find overdue activities")
        void shouldReturnOverdueActivities() {
            MailActivity overdue = MailActivity.builder()
                    .modelName("Project")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(assignedUserId)
                    .summary("Просроченная задача")
                    .dueDate(LocalDate.now().minusDays(2))
                    .status(MailActivityStatus.PLANNED)
                    .build();
            overdue.setId(UUID.randomUUID());
            overdue.setCreatedAt(Instant.now());

            when(mailActivityRepository.findOverdue(any(LocalDate.class)))
                    .thenReturn(List.of(overdue));

            List<MailActivityResponse> result = mailActivityService.findOverdueActivities();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).summary()).isEqualTo("Просроченная задача");
        }

        @Test
        @DisplayName("Should return empty list when no overdue activities")
        void shouldReturnEmptyList_whenNoOverdue() {
            when(mailActivityRepository.findOverdue(any(LocalDate.class)))
                    .thenReturn(List.of());

            List<MailActivityResponse> result = mailActivityService.findOverdueActivities();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get My Pending Activities")
    class MyPendingActivitiesTests {

        @Test
        @DisplayName("Should return pending activities for current user")
        void shouldReturnPendingActivities_forCurrentUser() {
            setUpSecurityContext();

            MailActivity pending = MailActivity.builder()
                    .modelName("Task")
                    .recordId(UUID.randomUUID())
                    .activityTypeId(activityTypeId)
                    .userId(userId)
                    .assignedUserId(userId)
                    .summary("Моя задача")
                    .dueDate(LocalDate.now().plusDays(1))
                    .status(MailActivityStatus.PLANNED)
                    .build();
            pending.setId(UUID.randomUUID());
            pending.setCreatedAt(Instant.now());

            Page<MailActivity> page = new PageImpl<>(List.of(pending));

            when(userRepository.findByEmail("user@privod.ru")).thenReturn(Optional.of(currentUser));
            when(mailActivityRepository.findByAssignedUserIdAndStatus(
                    eq(userId), eq(MailActivityStatus.PLANNED), any(Pageable.class)))
                    .thenReturn(page);

            List<MailActivityResponse> result = mailActivityService.getMyPendingActivities();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).summary()).isEqualTo("Моя задача");
            assertThat(result.get(0).status()).isEqualTo(MailActivityStatus.PLANNED);
        }
    }
}
