package com.privod.platform.modules.task;

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
import com.privod.platform.modules.task.service.TaskService;
import com.privod.platform.modules.task.web.dto.AddCommentRequest;
import com.privod.platform.modules.task.web.dto.AssignTaskRequest;
import com.privod.platform.modules.task.web.dto.ChangeTaskStatusRequest;
import com.privod.platform.modules.task.web.dto.CreateTaskRequest;
import com.privod.platform.modules.task.web.dto.GanttTaskResponse;
import com.privod.platform.modules.task.web.dto.TaskCommentResponse;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import com.privod.platform.modules.task.web.dto.TaskResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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
                .title("Подготовка фундамента")
                .description("Земляные работы и заливка фундамента")
                .projectId(projectId)
                .status(TaskStatus.BACKLOG)
                .priority(TaskPriority.HIGH)
                .assigneeId(UUID.randomUUID())
                .assigneeName("Иванов И.И.")
                .reporterId(UUID.randomUUID())
                .reporterName("Петров П.П.")
                .plannedStartDate(LocalDate.of(2025, 3, 1))
                .plannedEndDate(LocalDate.of(2025, 4, 30))
                .estimatedHours(new BigDecimal("160.00"))
                .wbsCode("1.1.1")
                .build();
        testTask.setId(taskId);
        testTask.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Task")
    class CreateTaskTests {

        @Test
        @DisplayName("Should create task with BACKLOG status and auto-generated code")
        void createTask_SetsDefaultStatusAndGeneratesCode() {
            CreateTaskRequest request = new CreateTaskRequest(
                    "Новая задача", "Описание задачи",
                    projectId, null, TaskPriority.HIGH,
                    UUID.randomUUID(), "Иванов И.И.",
                    UUID.randomUUID(), "Петров П.П.",
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 5, 31),
                    new BigDecimal("80.00"), null,
                    "1.2.1", 1, null, "фундамент,бетон", null);

            when(taskRepository.getNextCodeSequence()).thenReturn(1L);
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(invocation -> {
                ProjectTask t = invocation.getArgument(0);
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
    }

    @Nested
    @DisplayName("Assign Task")
    class AssignTaskTests {

        @Test
        @DisplayName("Should assign task to a user")
        void assignTask_UpdatesAssignee() {
            UUID newAssigneeId = UUID.randomUUID();
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            AssignTaskRequest request = new AssignTaskRequest(newAssigneeId, "Сидоров С.С.");
            TaskResponse response = taskService.assignTask(taskId, request);

            assertThat(response.assigneeId()).isEqualTo(newAssigneeId);
            assertThat(response.assigneeName()).isEqualTo("Сидоров С.С.");
            verify(auditService).logUpdate("ProjectTask", taskId, "assigneeId", null, newAssigneeId.toString());
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should allow valid status transition BACKLOG -> IN_PROGRESS and set actual start date")
        void changeStatus_ValidTransition() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(ProjectTask.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeTaskStatusRequest request = new ChangeTaskStatusRequest(TaskStatus.IN_PROGRESS);
            TaskResponse response = taskService.changeStatus(taskId, request);

            assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
            assertThat(response.actualStartDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("ProjectTask", taskId, "BACKLOG", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should reject invalid status transition BACKLOG -> DONE")
        void changeStatus_InvalidTransition() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            ChangeTaskStatusRequest request = new ChangeTaskStatusRequest(TaskStatus.DONE);

            assertThatThrownBy(() -> taskService.changeStatus(taskId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести задачу");
        }
    }

    @Nested
    @DisplayName("Add Comment")
    class AddCommentTests {

        @Test
        @DisplayName("Should add comment to existing task")
        void addComment_Success() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(commentRepository.save(any(TaskComment.class))).thenAnswer(invocation -> {
                TaskComment c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            AddCommentRequest request = new AddCommentRequest("Работа начата, бригада на объекте", "Иванов И.И.");
            TaskCommentResponse response = taskService.addComment(taskId, request);

            assertThat(response.content()).isEqualTo("Работа начата, бригада на объекте");
            assertThat(response.authorName()).isEqualTo("Иванов И.И.");
            assertThat(response.taskId()).isEqualTo(taskId);
        }
    }

    @Nested
    @DisplayName("Add Dependency")
    class AddDependencyTests {

        @Test
        @DisplayName("Should add dependency between two tasks")
        void addDependency_Success() {
            UUID dependsOnTaskId = UUID.randomUUID();
            ProjectTask predecessorTask = ProjectTask.builder()
                    .code("TASK-00002")
                    .title("Предшественник")
                    .status(TaskStatus.BACKLOG)
                    .priority(TaskPriority.NORMAL)
                    .build();
            predecessorTask.setId(dependsOnTaskId);
            predecessorTask.setCreatedAt(Instant.now());

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.findById(dependsOnTaskId)).thenReturn(Optional.of(predecessorTask));
            when(dependencyRepository.existsByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId)).thenReturn(false);
            when(dependencyRepository.save(any(TaskDependency.class))).thenAnswer(invocation -> {
                TaskDependency d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                return d;
            });

            TaskDependencyResponse response = taskService.addDependency(
                    taskId, dependsOnTaskId, DependencyType.FINISH_TO_START);

            assertThat(response.taskId()).isEqualTo(taskId);
            assertThat(response.dependsOnTaskId()).isEqualTo(dependsOnTaskId);
            assertThat(response.dependencyType()).isEqualTo(DependencyType.FINISH_TO_START);
        }

        @Test
        @DisplayName("Should reject self-dependency")
        void addDependency_SelfDependency() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            assertThatThrownBy(() -> taskService.addDependency(
                    taskId, taskId, DependencyType.FINISH_TO_START))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Задача не может зависеть от самой себя");
        }
    }

    @Nested
    @DisplayName("Get WBS")
    class GetWBSTests {

        @Test
        @DisplayName("Should return project WBS ordered by wbs code")
        void getProjectWBS_ReturnsOrdered() {
            ProjectTask task1 = ProjectTask.builder()
                    .code("TASK-00001").title("Фундамент").status(TaskStatus.BACKLOG)
                    .priority(TaskPriority.NORMAL).wbsCode("1.1").projectId(projectId).build();
            task1.setId(UUID.randomUUID());
            task1.setCreatedAt(Instant.now());

            ProjectTask task2 = ProjectTask.builder()
                    .code("TASK-00002").title("Стены").status(TaskStatus.BACKLOG)
                    .priority(TaskPriority.NORMAL).wbsCode("1.2").projectId(projectId).build();
            task2.setId(UUID.randomUUID());
            task2.setCreatedAt(Instant.now());

            when(taskRepository.findByProjectIdAndDeletedFalseOrderByWbsCodeAscSortOrderAsc(projectId))
                    .thenReturn(List.of(task1, task2));

            List<TaskResponse> wbs = taskService.getProjectWBS(projectId);

            assertThat(wbs).hasSize(2);
            assertThat(wbs.get(0).wbsCode()).isEqualTo("1.1");
            assertThat(wbs.get(1).wbsCode()).isEqualTo("1.2");
        }
    }

    @Nested
    @DisplayName("Get Gantt Data")
    class GetGanttDataTests {

        @Test
        @DisplayName("Should return tasks with dependencies for Gantt chart")
        void getGanttData_ReturnsTasksWithDependencies() {
            UUID task1Id = UUID.randomUUID();
            UUID task2Id = UUID.randomUUID();

            ProjectTask task1 = ProjectTask.builder()
                    .code("TASK-00001").title("Фундамент").status(TaskStatus.IN_PROGRESS)
                    .priority(TaskPriority.HIGH).projectId(projectId)
                    .plannedStartDate(LocalDate.of(2025, 3, 1))
                    .plannedEndDate(LocalDate.of(2025, 4, 30))
                    .progress(50).build();
            task1.setId(task1Id);
            task1.setCreatedAt(Instant.now());

            ProjectTask task2 = ProjectTask.builder()
                    .code("TASK-00002").title("Стены").status(TaskStatus.BACKLOG)
                    .priority(TaskPriority.NORMAL).projectId(projectId)
                    .plannedStartDate(LocalDate.of(2025, 5, 1))
                    .plannedEndDate(LocalDate.of(2025, 7, 31))
                    .progress(0).build();
            task2.setId(task2Id);
            task2.setCreatedAt(Instant.now());

            TaskDependency dep = TaskDependency.builder()
                    .taskId(task2Id).dependsOnTaskId(task1Id)
                    .dependencyType(DependencyType.FINISH_TO_START).build();
            dep.setId(UUID.randomUUID());

            when(taskRepository.findByProjectIdAndDeletedFalseOrderByPlannedStartDateAscSortOrderAsc(projectId))
                    .thenReturn(List.of(task1, task2));
            when(dependencyRepository.findByTaskId(task1Id)).thenReturn(List.of());
            when(dependencyRepository.findByTaskId(task2Id)).thenReturn(List.of(dep));

            List<GanttTaskResponse> gantt = taskService.getGanttData(projectId);

            assertThat(gantt).hasSize(2);
            assertThat(gantt.get(0).dependencies()).isEmpty();
            assertThat(gantt.get(1).dependencies()).hasSize(1);
            assertThat(gantt.get(1).dependencies().get(0).dependsOnTaskId()).isEqualTo(task1Id);
        }
    }
}
