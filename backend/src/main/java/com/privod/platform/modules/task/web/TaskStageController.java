package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.task.service.TaskStageService;
import com.privod.platform.modules.task.web.dto.CreateTaskStageRequest;
import com.privod.platform.modules.task.web.dto.TaskStageResponse;
import com.privod.platform.modules.task.web.dto.UpdateTaskStageRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/task-stages")
@RequiredArgsConstructor
@Tag(name = "Task Stages", description = "Custom task status/stage management")
public class TaskStageController {

    private final TaskStageService stageService;

    @GetMapping
    @Operation(summary = "Get stages for a project (or all if no projectId)")
    public ResponseEntity<ApiResponse<List<TaskStageResponse>>> getStages(
            @RequestParam(required = false) UUID projectId) {
        List<TaskStageResponse> stages = stageService.getStages(projectId);
        return ResponseEntity.ok(ApiResponse.ok(stages));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new stage")
    public ResponseEntity<ApiResponse<TaskStageResponse>> create(
            @Valid @RequestBody CreateTaskStageRequest request) {
        TaskStageResponse response = stageService.createStage(
                request.projectId(), request.name(), request.color(), request.icon(),
                request.description(),
                Boolean.TRUE.equals(request.isDefault()),
                Boolean.TRUE.equals(request.isClosed()),
                request.sequence());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a stage")
    public ResponseEntity<ApiResponse<TaskStageResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStageRequest request) {
        TaskStageResponse response = stageService.updateStage(
                id, request.name(), request.color(), request.icon(),
                request.description(), request.isClosed(), request.sequence());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a stage")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        stageService.deleteStage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Reorder stages")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @RequestParam UUID projectId,
            @RequestBody List<UUID> stageIds) {
        stageService.reorderStages(projectId, stageIds);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
