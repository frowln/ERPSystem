package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.task.service.TaskChecklistService;
import com.privod.platform.modules.task.web.dto.CreateChecklistItemRequest;
import com.privod.platform.modules.task.web.dto.TaskChecklistResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/{taskId}/checklist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
@Tag(name = "Task Checklist", description = "Task checklist management")
public class TaskChecklistController {

    private final TaskChecklistService checklistService;

    @GetMapping
    @Operation(summary = "Get checklist items for a task")
    public ResponseEntity<ApiResponse<List<TaskChecklistResponse>>> getChecklist(
            @PathVariable UUID taskId) {
        List<TaskChecklistResponse> items = checklistService.getChecklistItems(taskId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping
    @Operation(summary = "Add a checklist item to a task")
    public ResponseEntity<ApiResponse<TaskChecklistResponse>> addItem(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateChecklistItemRequest request) {
        TaskChecklistResponse response = checklistService.addChecklistItem(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{itemId}/toggle")
    @Operation(summary = "Toggle checklist item completion")
    public ResponseEntity<ApiResponse<TaskChecklistResponse>> toggleItem(
            @PathVariable UUID taskId,
            @PathVariable UUID itemId,
            @RequestParam(required = false) UUID completedById) {
        TaskChecklistResponse response = checklistService.toggleChecklistItem(itemId, completedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Delete a checklist item")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID taskId,
            @PathVariable UUID itemId) {
        checklistService.deleteChecklistItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
