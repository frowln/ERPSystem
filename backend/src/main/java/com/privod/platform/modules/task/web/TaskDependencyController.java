package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.task.service.TaskDependencyService;
import com.privod.platform.modules.task.service.TaskDependencyService.CriticalPathEntry;
import com.privod.platform.modules.task.web.dto.CreateTaskDependencyRequest;
import com.privod.platform.modules.task.web.dto.TaskDependencyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Task Dependencies", description = "Predecessor/successor dependency management and critical path analysis")
public class TaskDependencyController {

    private final TaskDependencyService dependencyService;

    @PostMapping("/tasks/dependencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a task dependency (predecessor/successor)")
    public ResponseEntity<ApiResponse<TaskDependencyResponse>> create(
            @Valid @RequestBody CreateTaskDependencyRequest request) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        TaskDependencyResponse response = dependencyService.createDependency(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/tasks/dependencies/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Delete a task dependency")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        dependencyService.deleteDependency(orgId, id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/tasks/{taskId}/dependencies")
    @Operation(summary = "Get all dependencies for a specific task (as predecessor or successor)")
    public ResponseEntity<ApiResponse<List<TaskDependencyResponse>>> getForTask(
            @PathVariable UUID taskId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        List<TaskDependencyResponse> deps = dependencyService.getDependencies(orgId, taskId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @GetMapping("/projects/{projectId}/task-dependencies")
    @Operation(summary = "Get all task dependencies for a project")
    public ResponseEntity<ApiResponse<List<TaskDependencyResponse>>> getForProject(
            @PathVariable UUID projectId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        List<TaskDependencyResponse> deps = dependencyService.getProjectDependencies(orgId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(deps));
    }

    @GetMapping("/projects/{projectId}/critical-path")
    @Operation(summary = "Compute the critical path for a project based on task dependencies")
    public ResponseEntity<ApiResponse<List<CriticalPathEntry>>> getCriticalPath(
            @PathVariable UUID projectId) {
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        List<CriticalPathEntry> path = dependencyService.getCriticalPath(orgId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(path));
    }
}
