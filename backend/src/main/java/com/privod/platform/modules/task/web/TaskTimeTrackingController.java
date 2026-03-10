package com.privod.platform.modules.task.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.task.service.TaskTimeTrackingService;
import com.privod.platform.modules.task.web.dto.CreateTimeEntryRequest;
import com.privod.platform.modules.task.web.dto.StartTimerRequest;
import com.privod.platform.modules.task.web.dto.TaskTimeEntryResponse;
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
@RequestMapping("/api/tasks/{taskId}/time-entries")
@RequiredArgsConstructor
@Tag(name = "Task Time Tracking", description = "Timer and time entry management")
public class TaskTimeTrackingController {

    private final TaskTimeTrackingService timeTrackingService;

    @GetMapping
    @Operation(summary = "Get time entries for a task")
    public ResponseEntity<ApiResponse<List<TaskTimeEntryResponse>>> getTimeEntries(@PathVariable UUID taskId) {
        List<TaskTimeEntryResponse> entries = timeTrackingService.getTaskTimeEntries(taskId);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @PostMapping("/timer/start")
    @Operation(summary = "Start timer for a task")
    public ResponseEntity<ApiResponse<TaskTimeEntryResponse>> startTimer(
            @PathVariable UUID taskId,
            @Valid @RequestBody StartTimerRequest request) {
        TaskTimeEntryResponse response = timeTrackingService.startTimer(taskId, request.userId(), request.userName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/timer/stop")
    @Operation(summary = "Stop timer for a task")
    public ResponseEntity<ApiResponse<TaskTimeEntryResponse>> stopTimer(
            @PathVariable UUID taskId,
            @RequestParam UUID userId) {
        TaskTimeEntryResponse response = timeTrackingService.stopTimer(taskId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Add manual time entry")
    public ResponseEntity<ApiResponse<TaskTimeEntryResponse>> addManualEntry(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateTimeEntryRequest request) {
        TaskTimeEntryResponse response = timeTrackingService.addManualEntry(
                taskId, request.userId(), request.userName(),
                request.startedAt(), request.stoppedAt(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{entryId}")
    @Operation(summary = "Delete a time entry")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable UUID taskId,
            @PathVariable UUID entryId) {
        timeTrackingService.deleteEntry(entryId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/total")
    @Operation(summary = "Get total tracked time for a task")
    public ResponseEntity<ApiResponse<Long>> getTotalDuration(@PathVariable UUID taskId) {
        long total = timeTrackingService.getTotalDuration(taskId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }
}
