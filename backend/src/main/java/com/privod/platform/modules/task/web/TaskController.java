package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.task.domain.DependencyType;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.service.TaskService;
import com.privod.platform.modules.task.web.dto.AddCommentRequest;
import com.privod.platform.modules.task.web.dto.AddDependencyRequest;
import com.privod.platform.modules.task.web.dto.AssignTaskRequest;
import com.privod.platform.modules.task.web.dto.ChangeTaskStatusRequest;
import com.privod.platform.modules.task.web.dto.CreateTaskRequest;
import com.privod.platform.modules.task.web.dto.GanttTaskResponse;
import com.privod.platform.modules.task.web.dto.TaskCommentResponse;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import com.privod.platform.modules.task.web.dto.TaskResponse;
import com.privod.platform.modules.task.web.dto.TaskSummaryResponse;
import com.privod.platform.modules.task.web.dto.UpdateProgressRequest;
import com.privod.platform.modules.task.web.dto.UpdateTaskRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "List tasks with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<TaskResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID parentTaskId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TaskResponse> page = taskService.listTasks(projectId, status, priority, assigneeId, parentTaskId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID with comments")
    public ResponseEntity<ApiResponse<TaskResponse>> getById(@PathVariable UUID id) {
        TaskResponse response = taskService.getTask(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<TaskResponse>> create(
            @Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update an existing task")
    public ResponseEntity<ApiResponse<TaskResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest request) {
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Change task status")
    public ResponseEntity<ApiResponse<TaskResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeTaskStatusRequest request) {
        TaskResponse response = taskService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Assign task to a user")
    public ResponseEntity<ApiResponse<TaskResponse>> assign(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTaskRequest request) {
        TaskResponse response = taskService.assignTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update task progress")
    public ResponseEntity<ApiResponse<TaskResponse>> updateProgress(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProgressRequest request) {
        TaskResponse response = taskService.updateProgress(id, request.progress());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to a task")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody AddCommentRequest request) {
        TaskCommentResponse response = taskService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/subtasks")
    @Operation(summary = "Get subtasks of a task")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getSubtasks(@PathVariable UUID id) {
        List<TaskResponse> subtasks = taskService.getSubtasks(id);
        return ResponseEntity.ok(ApiResponse.ok(subtasks));
    }

    @GetMapping("/project/{projectId}/wbs")
    @Operation(summary = "Get project WBS hierarchy")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectWBS(
            @PathVariable UUID projectId) {
        List<TaskResponse> wbs = taskService.getProjectWBS(projectId);
        return ResponseEntity.ok(ApiResponse.ok(wbs));
    }

    @PostMapping("/{id}/dependencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Add a dependency to a task")
    public ResponseEntity<ApiResponse<TaskDependencyResponse>> addDependency(
            @PathVariable UUID id,
            @Valid @RequestBody AddDependencyRequest request) {
        TaskDependencyResponse response = taskService.addDependency(
                id, request.dependsOnTaskId(), request.dependencyType());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/dependencies/{dependsOnTaskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Remove a dependency from a task")
    public ResponseEntity<ApiResponse<Void>> removeDependency(
            @PathVariable UUID id,
            @PathVariable UUID dependsOnTaskId) {
        taskService.removeDependency(id, dependsOnTaskId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/project/{projectId}/gantt")
    @Operation(summary = "Get Gantt chart data for a project")
    public ResponseEntity<ApiResponse<List<GanttTaskResponse>>> getGanttData(
            @PathVariable UUID projectId) {
        List<GanttTaskResponse> gantt = taskService.getGanttData(projectId);
        return ResponseEntity.ok(ApiResponse.ok(gantt));
    }

    @GetMapping("/project/{projectId}/summary")
    @Operation(summary = "Get project task summary statistics")
    public ResponseEntity<ApiResponse<TaskSummaryResponse>> getProjectTaskSummary(
            @PathVariable UUID projectId) {
        TaskSummaryResponse summary = taskService.getProjectTaskSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/project/{projectId}/overdue")
    @Operation(summary = "Get overdue tasks for a project")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getOverdueTasks(
            @PathVariable UUID projectId) {
        List<TaskResponse> overdue = taskService.getOverdueTasks(projectId);
        return ResponseEntity.ok(ApiResponse.ok(overdue));
    }
}
