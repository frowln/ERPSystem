package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.task.service.TaskLabelService;
import com.privod.platform.modules.task.web.dto.CreateTaskLabelRequest;
import com.privod.platform.modules.task.web.dto.TaskLabelResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/task-labels")
@RequiredArgsConstructor
@Tag(name = "Task Labels", description = "Label/tag management for tasks")
public class TaskLabelController {

    private final TaskLabelService labelService;

    @GetMapping
    @Operation(summary = "Get all labels")
    public ResponseEntity<ApiResponse<List<TaskLabelResponse>>> getLabels(
            @RequestParam(required = false) UUID organizationId) {
        List<TaskLabelResponse> labels = labelService.getLabels(organizationId);
        return ResponseEntity.ok(ApiResponse.ok(labels));
    }

    @PostMapping
    @Operation(summary = "Create a new label")
    public ResponseEntity<ApiResponse<TaskLabelResponse>> createLabel(
            @Valid @RequestBody CreateTaskLabelRequest request,
            @RequestParam(required = false) UUID organizationId) {
        TaskLabelResponse response = labelService.createLabel(
                request.name(), request.color(), request.icon(), organizationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a label")
    public ResponseEntity<ApiResponse<TaskLabelResponse>> updateLabel(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTaskLabelRequest request) {
        TaskLabelResponse response = labelService.updateLabel(id, request.name(), request.color(), request.icon());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a label")
    public ResponseEntity<ApiResponse<Void>> deleteLabel(@PathVariable UUID id) {
        labelService.deleteLabel(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/tasks/{taskId}/labels/{labelId}")
    @Operation(summary = "Assign a label to a task")
    public ResponseEntity<ApiResponse<Void>> assignLabel(
            @PathVariable UUID taskId,
            @PathVariable UUID labelId) {
        labelService.assignLabel(taskId, labelId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/tasks/{taskId}/labels/{labelId}")
    @Operation(summary = "Remove a label from a task")
    public ResponseEntity<ApiResponse<Void>> removeLabel(
            @PathVariable UUID taskId,
            @PathVariable UUID labelId) {
        labelService.removeLabel(taskId, labelId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "Get labels for a task")
    public ResponseEntity<ApiResponse<List<TaskLabelResponse>>> getTaskLabels(@PathVariable UUID taskId) {
        List<TaskLabelResponse> labels = labelService.getTaskLabels(taskId);
        return ResponseEntity.ok(ApiResponse.ok(labels));
    }
}
