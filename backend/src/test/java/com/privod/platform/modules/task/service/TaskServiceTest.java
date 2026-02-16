package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.DependencyType;
import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskComment;
import com.privod.platform.modules.task.domain.TaskDependency;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import com.privod.platform.modules.task.repository.TaskCommentRepository;
import com.privod.platform.modules.task.repository.TaskDependencyRepository;
import com.privod.platform.modules.task.web.dto.AddCommentRequest;
import com.privod.platform.modules.task.web.dto.AssignTaskRequest;
import com.privod.platform.modules.task.web.dto.ChangeTaskStatusRequest;
import com.privod.platform.modules.task.web.dto.CreateTaskRequest;
import com.privod.platform.modules.task.web.dto.TaskCommentResponse;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import com.privod.platform.modules.task.web.dto.TaskResponse;
import com.privod.platform.modules.task.web.dto.UpdateTaskRequest;
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
import java.util.Collections;
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
class TaskServiceTest {

    @Mock
    private ProjectTaskRepository taskRepository;

    @Mock
    private TaskCommentRepository commentRepository;

    @Mock
    private TaskDependencyRepository dependencyRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TaskService taskService;

    private UUID taskId;
    private UUID projectId;
    private ProjectTask testTask;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testTask = ProjectTask.builder()
                .code("TASK-00001")
                .title("Подготовка площадки")
                .description("Подготовительные работы")
                .projectId(projectId)
                .status(TaskStatus.BACKLOG)
                .priority(TaskPriority.NORMAL)
                .progress(0)
                .sortOrder(0)
                .build();
        testTask.setId(taskId);
        testTask.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Task")
    class CreateTaskTests {

        @Test
        @DisplayName("Should create task with BACKLOG status")
        void shouldCreateTask_whenValidInput() {
            CreateTaskRequest request = new CreateTaskRequest(
                    "Новая задача", "Описание задачи", projectId, null,
                    TaskPriority.HIGH, UUID.randomUUID(), "Исполнитель",
                    UUID.randomUUID(), "Автор",
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 15),
                    40, null, null, 0, null, null, null);

            when(taskRepository.getNextCodeSequence()).thenReturn(1L);
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> {
                ProjectTask t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            TaskResponse response = taskService.createTask(request);

            assertThat(response.status()).isEqualTo(TaskStatus.BACKLOG);
            assertThat(response.code()).isEqualTo("TASK-00001");
            assertThat(response.priority()).isEqualTo(TaskPriority.HIGH);
            verify(auditService).logCreate(eq("ProjectTask"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use NORMAL priority by default")
        void shouldUseNormalPriority_whenNotSpecified() {
            CreateTaskRequest request = new CreateTaskRequest(
                    "Задача", null, projectId, null,
                    null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null);

            when(taskRepository.getNextCodeSequence()).thenReturn(2L);
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> {
                ProjectTask t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            TaskResponse response = taskService.createTask(request);

            assertThat(response.priority()).isEqualTo(TaskPriority.NORMAL);
        }

        @Test
        @DisplayName("Should reject task with end date before start date")
        void shouldThrowException_whenEndDateBeforeStartDate() {
            CreateTaskRequest request = new CreateTaskRequest(
                    "Задача", null, projectId, null,
                    null, null, null, null, null,
                    LocalDate.of(2025, 7, 15), LocalDate.of(2025, 7, 1),
                    null, null, null, null, null, null, null);

            when(taskRepository.getNextCodeSequence()).thenReturn(3L);

            assertThatThrownBy(() -> taskService.createTask(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания должна быть позже даты начала");
        }
    }

    @Nested
    @DisplayName("Get Task")
    class GetTaskTests {

        @Test
        @DisplayName("Should find task by ID")
        void shouldReturnTask_whenExists() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(commentRepository.findByTaskIdAndDeletedFalseOrderByCreatedAtAsc(taskId))
                    .thenReturn(Collections.emptyList());

            TaskResponse response = taskService.getTask(taskId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("TASK-00001");
        }

        @Test
        @DisplayName("Should throw when task not found")
        void shouldThrowException_whenTaskNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(taskRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTask(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Задача не найдена");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should set actualStartDate when transitioning to IN_PROGRESS")
        void shouldSetActualStartDate_whenInProgress() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeTaskStatusRequest request = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS);

            TaskResponse response = taskService.changeStatus(taskId, request);

            assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
            assertThat(testTask.getActualStartDate()).isNotNull();
            verify(auditService).logStatusChange("ProjectTask", taskId, "BACKLOG", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should set actualEndDate and progress 100 when DONE")
        void shouldSetActualEndAndProgress_whenDone() {
            testTask.setStatus(TaskStatus.IN_PROGRESS);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeTaskStatusRequest request = new ChangeTaskStatusRequest(TaskStatus.DONE);

            TaskResponse response = taskService.changeStatus(taskId, request);

            assertThat(response.status()).isEqualTo(TaskStatus.DONE);
            assertThat(testTask.getActualEndDate()).isNotNull();
            assertThat(testTask.getProgress()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            ChangeTaskStatusRequest request = new ChangeTaskStatusRequest(TaskStatus.DONE);

            assertThatThrownBy(() -> taskService.changeStatus(taskId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести задачу");
        }
    }

    @Nested
    @DisplayName("Task Assignment")
    class AssignmentTests {

        @Test
        @DisplayName("Should assign task to user")
        void shouldAssignTask_whenValidInput() {
            UUID assigneeId = UUID.randomUUID();
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            AssignTaskRequest request = new AssignTaskRequest(assigneeId, "Петров П.П.");

            TaskResponse response = taskService.assignTask(taskId, request);

            assertThat(testTask.getAssigneeId()).isEqualTo(assigneeId);
            assertThat(testTask.getAssigneeName()).isEqualTo("Петров П.П.");
        }
    }

    @Nested
    @DisplayName("Progress Updates")
    class ProgressTests {

        @Test
        @DisplayName("Should update progress")
        void shouldUpdateProgress_whenValid() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskResponse response = taskService.updateProgress(taskId, 50);

            assertThat(testTask.getProgress()).isEqualTo(50);
        }

        @Test
        @DisplayName("Should auto-complete task when progress is 100")
        void shouldAutoComplete_whenProgressIs100() {
            testTask.setStatus(TaskStatus.IN_PROGRESS);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            taskService.updateProgress(taskId, 100);

            assertThat(testTask.getStatus()).isEqualTo(TaskStatus.DONE);
            assertThat(testTask.getActualEndDate()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid progress values")
        void shouldThrowException_whenProgressInvalid() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            assertThatThrownBy(() -> taskService.updateProgress(taskId, -1))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Прогресс должен быть от 0 до 100");

            assertThatThrownBy(() -> taskService.updateProgress(taskId, 101))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Прогресс должен быть от 0 до 100");
        }
    }

    @Nested
    @DisplayName("Dependencies")
    class DependencyTests {

        @Test
        @DisplayName("Should reject self-dependency")
        void shouldThrowException_whenSelfDependency() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            assertThatThrownBy(() -> taskService.addDependency(taskId, taskId, DependencyType.FINISH_TO_START))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Задача не может зависеть от самой себя");
        }

        @Test
        @DisplayName("Should reject duplicate dependency")
        void shouldThrowException_whenDuplicateDependency() {
            UUID dependsOnId = UUID.randomUUID();
            ProjectTask dependsOnTask = ProjectTask.builder()
                    .code("TASK-00002").title("Other").projectId(projectId)
                    .status(TaskStatus.BACKLOG).priority(TaskPriority.NORMAL).build();
            dependsOnTask.setId(dependsOnId);
            dependsOnTask.setCreatedAt(Instant.now());

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.findById(dependsOnId)).thenReturn(Optional.of(dependsOnTask));
            when(dependencyRepository.existsByTaskIdAndDependsOnTaskId(taskId, dependsOnId)).thenReturn(true);

            assertThatThrownBy(() -> taskService.addDependency(taskId, dependsOnId, DependencyType.FINISH_TO_START))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Зависимость уже существует");
        }
    }
}
