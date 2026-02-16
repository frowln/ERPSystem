package com.privod.platform.modules.chatter;

import com.privod.platform.modules.chatter.domain.Activity;
import com.privod.platform.modules.chatter.domain.ActivityStatus;
import com.privod.platform.modules.chatter.domain.ChatterActivityType;
import com.privod.platform.modules.chatter.repository.ActivityRepository;
import com.privod.platform.modules.chatter.service.ActivityService;
import com.privod.platform.modules.chatter.web.dto.ActivityResponse;
import com.privod.platform.modules.chatter.web.dto.CreateActivityRequest;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private ActivityService activityService;

    private UUID activityId;
    private UUID entityId;
    private UUID assigneeId;
    private Activity testActivity;

    @BeforeEach
    void setUp() {
        activityId = UUID.randomUUID();
        entityId = UUID.randomUUID();
        assigneeId = UUID.randomUUID();

        testActivity = Activity.builder()
                .entityType("project")
                .entityId(entityId)
                .activityType(ChatterActivityType.TASK)
                .summary("Проверить готовность площадки")
                .description("Провести осмотр строительной площадки")
                .assignedToId(assigneeId)
                .dueDate(LocalDate.now().plusDays(7))
                .status(ActivityStatus.PLANNED)
                .build();
        testActivity.setId(activityId);
        testActivity.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Activity")
    class CreateTests {

        @Test
        @DisplayName("Should create an activity with default PLANNED status")
        void createActivity_Success() {
            CreateActivityRequest request = new CreateActivityRequest(
                    "project", entityId, ChatterActivityType.TASK,
                    "Проверить готовность площадки",
                    "Провести осмотр строительной площадки",
                    assigneeId, LocalDate.now().plusDays(7)
            );

            when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
                Activity a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ActivityResponse response = activityService.create(request);

            assertThat(response.activityType()).isEqualTo(ChatterActivityType.TASK);
            assertThat(response.status()).isEqualTo(ActivityStatus.PLANNED);
            assertThat(response.activityTypeDisplayName()).isEqualTo("Задача");
            assertThat(response.statusDisplayName()).isEqualTo("Запланировано");
            assertThat(response.assignedToId()).isEqualTo(assigneeId);
        }

        @Test
        @DisplayName("Should create an approval activity")
        void createActivity_Approval() {
            CreateActivityRequest request = new CreateActivityRequest(
                    "contract", entityId, ChatterActivityType.APPROVAL,
                    "Согласование контракта КД-001",
                    null, assigneeId, LocalDate.now().plusDays(3)
            );

            when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> {
                Activity a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ActivityResponse response = activityService.create(request);

            assertThat(response.activityType()).isEqualTo(ChatterActivityType.APPROVAL);
            assertThat(response.activityTypeDisplayName()).isEqualTo("Согласование");
        }
    }

    @Nested
    @DisplayName("Mark Done")
    class MarkDoneTests {

        @Test
        @DisplayName("Should mark activity as done")
        void markDone_Success() {
            UUID completedById = UUID.randomUUID();
            when(activityRepository.findById(activityId)).thenReturn(Optional.of(testActivity));
            when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> inv.getArgument(0));

            ActivityResponse response = activityService.markDone(activityId, completedById);

            assertThat(response.status()).isEqualTo(ActivityStatus.DONE);
            assertThat(response.statusDisplayName()).isEqualTo("Завершено");
            assertThat(response.completedById()).isEqualTo(completedById);
            assertThat(response.completedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw when activity not found")
        void markDone_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(activityRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> activityService.markDone(nonExistentId, assigneeId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Активность не найдена");
        }
    }

    @Nested
    @DisplayName("Cancel Activity")
    class CancelTests {

        @Test
        @DisplayName("Should cancel an activity")
        void cancel_Success() {
            when(activityRepository.findById(activityId)).thenReturn(Optional.of(testActivity));
            when(activityRepository.save(any(Activity.class))).thenAnswer(inv -> inv.getArgument(0));

            ActivityResponse response = activityService.cancel(activityId);

            assertThat(response.status()).isEqualTo(ActivityStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("Overdue Activities")
    class OverdueTests {

        @Test
        @DisplayName("Should detect overdue activities")
        void getOverdue_Success() {
            Activity overdueActivity = Activity.builder()
                    .entityType("project")
                    .entityId(entityId)
                    .activityType(ChatterActivityType.DEADLINE)
                    .summary("Просроченная задача")
                    .assignedToId(assigneeId)
                    .dueDate(LocalDate.now().minusDays(2))
                    .status(ActivityStatus.PLANNED)
                    .build();
            overdueActivity.setId(UUID.randomUUID());
            overdueActivity.setCreatedAt(Instant.now());

            when(activityRepository.findOverdueActivities(any(LocalDate.class)))
                    .thenReturn(List.of(overdueActivity));

            List<ActivityResponse> result = activityService.getOverdueActivities();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).overdue()).isTrue();
        }
    }
}
