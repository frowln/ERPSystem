package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.notification.service.WebSocketNotificationService;
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
import com.privod.platform.modules.task.web.dto.GanttTaskResponse;
import com.privod.platform.modules.task.web.dto.TaskCommentResponse;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import com.privod.platform.modules.task.web.dto.TaskResponse;
import com.privod.platform.modules.task.web.dto.TaskSummaryResponse;
import com.privod.platform.modules.task.web.dto.UpdateTaskRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final ProjectTaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final AuditService auditService;
    private final WebSocketNotificationService wsNotificationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<TaskResponse> listTasks(UUID projectId, TaskStatus status, TaskPriority priority,
                                         UUID assigneeId, UUID parentTaskId, Pageable pageable) {
        Specification<ProjectTask> spec = Specification.where(TaskSpecification.notDeleted())
                .and(TaskSpecification.belongsToProject(projectId))
                .and(TaskSpecification.hasStatus(status))
                .and(TaskSpecification.hasPriority(priority))
                .and(TaskSpecification.assignedTo(assigneeId))
                .and(TaskSpecification.hasParentTask(parentTaskId));

        return taskRepository.findAll(spec, pageable).map(TaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID id) {
        ProjectTask task = getTaskOrThrow(id);
        List<TaskCommentResponse> comments = commentRepository
                .findByTaskIdAndDeletedFalseOrderByCreatedAtAsc(id)
                .stream()
                .map(TaskCommentResponse::fromEntity)
                .toList();
        return TaskResponse.fromEntity(task, comments);
    }

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        validateDates(request.plannedStartDate(), request.plannedEndDate());

        String code = generateTaskCode();

        ProjectTask task = ProjectTask.builder()
                .code(code)
                .title(request.title())
                .description(request.description())
                .projectId(request.projectId())
                .parentTaskId(request.parentTaskId())
                .status(TaskStatus.BACKLOG)
                .priority(request.priority() != null ? request.priority() : TaskPriority.NORMAL)
                .assigneeId(request.assigneeId())
                .assigneeName(request.assigneeName())
                .reporterId(request.reporterId())
                .reporterName(request.reporterName())
                .plannedStartDate(request.plannedStartDate())
                .plannedEndDate(request.plannedEndDate())
                .estimatedHours(request.estimatedHours())
                .progress(request.progress() != null ? request.progress() : 0)
                .wbsCode(request.wbsCode())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .specItemId(request.specItemId())
                .tags(request.tags())
                .notes(request.notes())
                .build();

        task = taskRepository.save(task);
        auditService.logCreate("ProjectTask", task.getId());

        log.info("Task created: {} - {} ({})", task.getCode(), task.getTitle(), task.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateTask(UUID id, UpdateTaskRequest request) {
        ProjectTask task = getTaskOrThrow(id);

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.projectId() != null) {
            task.setProjectId(request.projectId());
        }
        if (request.parentTaskId() != null) {
            task.setParentTaskId(request.parentTaskId());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.assigneeId() != null) {
            task.setAssigneeId(request.assigneeId());
        }
        if (request.assigneeName() != null) {
            task.setAssigneeName(request.assigneeName());
        }
        if (request.reporterId() != null) {
            task.setReporterId(request.reporterId());
        }
        if (request.reporterName() != null) {
            task.setReporterName(request.reporterName());
        }
        if (request.plannedStartDate() != null) {
            task.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            task.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            task.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            task.setActualEndDate(request.actualEndDate());
        }
        if (request.estimatedHours() != null) {
            task.setEstimatedHours(request.estimatedHours());
        }
        if (request.actualHours() != null) {
            task.setActualHours(request.actualHours());
        }
        if (request.progress() != null) {
            task.setProgress(request.progress());
        }
        if (request.wbsCode() != null) {
            task.setWbsCode(request.wbsCode());
        }
        if (request.sortOrder() != null) {
            task.setSortOrder(request.sortOrder());
        }
        if (request.specItemId() != null) {
            task.setSpecItemId(request.specItemId());
        }
        if (request.tags() != null) {
            task.setTags(request.tags());
        }
        if (request.notes() != null) {
            task.setNotes(request.notes());
        }

        validateDates(task.getPlannedStartDate(), task.getPlannedEndDate());

        task = taskRepository.save(task);
        auditService.logUpdate("ProjectTask", task.getId(), "multiple", null, null);

        log.info("Task updated: {} ({})", task.getCode(), task.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse changeStatus(UUID id, ChangeTaskStatusRequest request) {
        ProjectTask task = getTaskOrThrow(id);
        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.status();

        if (!task.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести задачу из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        task.setStatus(newStatus);

        // Auto-set dates on status transitions
        if (newStatus == TaskStatus.IN_PROGRESS && task.getActualStartDate() == null) {
            task.setActualStartDate(LocalDate.now());
        }
        if (newStatus == TaskStatus.DONE) {
            task.setActualEndDate(LocalDate.now());
            task.setProgress(100);
        }

        task = taskRepository.save(task);
        auditService.logStatusChange("ProjectTask", task.getId(), oldStatus.name(), newStatus.name());

        // Push real-time status change to project subscribers
        if (task.getProjectId() != null) {
            wsNotificationService.notifyStatusChange(
                    task.getProjectId(), "task", task.getId().toString(),
                    task.getTitle(), oldStatus.name(), newStatus.name());
        }

        log.info("Task status changed: {} from {} to {} ({})",
                task.getCode(), oldStatus, newStatus, task.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse assignTask(UUID id, AssignTaskRequest request) {
        ProjectTask task = getTaskOrThrow(id);

        task.setAssigneeId(request.assigneeId());
        task.setAssigneeName(request.assigneeName());

        task = taskRepository.save(task);
        auditService.logUpdate("ProjectTask", task.getId(), "assigneeId", null, request.assigneeId().toString());

        // Persist in-app notification for the assigned user
        notificationService.send(
                request.assigneeId(),
                "Новая задача назначена: " + task.getTitle(),
                "Вам назначена задача " + task.getCode() + " — " + task.getTitle(),
                NotificationType.TASK,
                "ProjectTask",
                task.getId(),
                "/tasks/" + task.getId()
        );

        // Also broadcast to project subscribers via WebSocket
        if (task.getProjectId() != null) {
            wsNotificationService.notifyStatusChange(
                    task.getProjectId(), "task", task.getId().toString(),
                    task.getTitle(), "unassigned",
                    "assigned to " + request.assigneeName());
        }

        log.info("Task assigned: {} to {} ({})", task.getCode(), request.assigneeName(), task.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateProgress(UUID id, Integer progress) {
        ProjectTask task = getTaskOrThrow(id);

        if (progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Прогресс должен быть от 0 до 100");
        }

        task.setProgress(progress);

        if (progress == 100 && task.getStatus() != TaskStatus.DONE) {
            task.setStatus(TaskStatus.DONE);
            task.setActualEndDate(LocalDate.now());
        }

        task = taskRepository.save(task);
        auditService.logUpdate("ProjectTask", task.getId(), "progress", null, String.valueOf(progress));

        log.info("Task progress updated: {} to {}% ({})", task.getCode(), progress, task.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskCommentResponse addComment(UUID taskId, AddCommentRequest request) {
        ProjectTask task = getTaskOrThrow(taskId);

        TaskComment comment = TaskComment.builder()
                .taskId(taskId)
                .authorName(request.authorName())
                .content(request.content())
                .build();

        comment = commentRepository.save(comment);

        // Notify project subscribers about the new comment
        if (task.getProjectId() != null) {
            wsNotificationService.notifyNewComment(
                    task.getProjectId(), "task", task.getId().toString(),
                    task.getTitle(), request.authorName());
        }

        // If the task has an assignee different from the commenter, send a personal notification
        if (task.getAssigneeId() != null) {
            notificationService.send(
                    task.getAssigneeId(),
                    "Новый комментарий: " + task.getTitle(),
                    request.authorName() + " оставил комментарий к задаче " + task.getCode(),
                    NotificationType.INFO,
                    "ProjectTask",
                    task.getId(),
                    "/tasks/" + task.getId()
            );
        }

        log.info("Comment added to task: {} ({})", taskId, comment.getId());
        return TaskCommentResponse.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getSubtasks(UUID parentTaskId) {
        return taskRepository.findByParentTaskIdAndDeletedFalseOrderBySortOrderAsc(parentTaskId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectWBS(UUID projectId) {
        return taskRepository.findByProjectIdAndDeletedFalseOrderByWbsCodeAscSortOrderAsc(projectId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskDependencyResponse addDependency(UUID taskId, UUID dependsOnTaskId, DependencyType type) {
        getTaskOrThrow(taskId);
        getTaskOrThrow(dependsOnTaskId);

        if (taskId.equals(dependsOnTaskId)) {
            throw new IllegalArgumentException("Задача не может зависеть от самой себя");
        }

        if (dependencyRepository.existsByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId)) {
            throw new IllegalStateException("Зависимость уже существует");
        }

        TaskDependency dependency = TaskDependency.builder()
                .taskId(taskId)
                .dependsOnTaskId(dependsOnTaskId)
                .dependencyType(type != null ? type : DependencyType.FINISH_TO_START)
                .build();

        dependency = dependencyRepository.save(dependency);

        log.info("Dependency added: {} depends on {} ({})", taskId, dependsOnTaskId, dependency.getId());
        return TaskDependencyResponse.fromEntity(dependency);
    }

    @Transactional
    public void removeDependency(UUID taskId, UUID dependsOnTaskId) {
        TaskDependency dependency = dependencyRepository
                .findByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Зависимость не найдена: " + taskId + " -> " + dependsOnTaskId));

        dependencyRepository.delete(dependency);

        log.info("Dependency removed: {} -> {}", taskId, dependsOnTaskId);
    }

    @Transactional(readOnly = true)
    public List<GanttTaskResponse> getGanttData(UUID projectId) {
        List<ProjectTask> tasks = taskRepository
                .findByProjectIdAndDeletedFalseOrderByPlannedStartDateAscSortOrderAsc(projectId);

        return tasks.stream().map(task -> {
            List<TaskDependencyResponse> deps = dependencyRepository.findByTaskId(task.getId())
                    .stream()
                    .map(TaskDependencyResponse::fromEntity)
                    .toList();
            return GanttTaskResponse.fromEntity(task, deps);
        }).toList();
    }

    @Transactional(readOnly = true)
    public TaskSummaryResponse getProjectTaskSummary(UUID projectId) {
        long totalTasks = taskRepository.countActiveTasks(projectId);

        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = taskRepository.countByStatusAndProjectId(projectId);
        for (Object[] row : statusData) {
            TaskStatus status = (TaskStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        Map<String, Long> priorityCounts = new HashMap<>();
        List<Object[]> priorityData = taskRepository.countByPriorityAndProjectId(projectId);
        for (Object[] row : priorityData) {
            TaskPriority priority = (TaskPriority) row[0];
            Long count = (Long) row[1];
            priorityCounts.put(priority.name(), count);
        }

        Map<String, Long> assigneeCounts = new HashMap<>();
        List<Object[]> assigneeData = taskRepository.countByAssigneeAndProjectId(projectId);
        for (Object[] row : assigneeData) {
            String assigneeName = (String) row[0];
            Long count = (Long) row[1];
            assigneeCounts.put(assigneeName, count);
        }

        return new TaskSummaryResponse(totalTasks, statusCounts, priorityCounts, assigneeCounts);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getOverdueTasks(UUID projectId) {
        List<TaskStatus> excludeStatuses = List.of(TaskStatus.DONE, TaskStatus.CANCELLED);
        return taskRepository.findOverdueTasks(projectId, LocalDate.now(), excludeStatuses)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    private ProjectTask getTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + id));
    }

    private String generateTaskCode() {
        long seq = taskRepository.getNextCodeSequence();
        return String.format("TASK-%05d", seq);
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }
}
