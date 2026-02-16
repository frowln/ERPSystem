package com.privod.platform.modules.calendar.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.calendar.service.ScheduleItemService;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleItemRequest;
import com.privod.platform.modules.calendar.web.dto.GanttItemResponse;
import com.privod.platform.modules.calendar.web.dto.ScheduleItemResponse;
import com.privod.platform.modules.calendar.web.dto.UpdateProgressRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateScheduleItemRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar/schedules/{scheduleId}/items")
@RequiredArgsConstructor
@Tag(name = "Schedule Items", description = "Schedule item management endpoints")
public class ScheduleItemController {

    private final ScheduleItemService itemService;

    @GetMapping
    @Operation(summary = "List all items in a schedule")
    public ResponseEntity<ApiResponse<List<ScheduleItemResponse>>> list(@PathVariable UUID scheduleId) {
        List<ScheduleItemResponse> items = itemService.listItems(scheduleId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/{itemId}")
    @Operation(summary = "Get a schedule item by ID")
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> getById(
            @PathVariable UUID scheduleId,
            @PathVariable UUID itemId) {
        ScheduleItemResponse response = itemService.getItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new schedule item")
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> create(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody CreateScheduleItemRequest request) {
        ScheduleItemResponse response = itemService.createItem(scheduleId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a schedule item")
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> update(
            @PathVariable UUID scheduleId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateScheduleItemRequest request) {
        ScheduleItemResponse response = itemService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a schedule item")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID scheduleId,
            @PathVariable UUID itemId) {
        itemService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{itemId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Update progress of a schedule item")
    public ResponseEntity<ApiResponse<ScheduleItemResponse>> updateProgress(
            @PathVariable UUID scheduleId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateProgressRequest request) {
        ScheduleItemResponse response = itemService.updateProgress(itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Reorder schedule items")
    public ResponseEntity<ApiResponse<List<ScheduleItemResponse>>> reorder(
            @PathVariable UUID scheduleId,
            @RequestBody List<UUID> itemIds) {
        List<ScheduleItemResponse> items = itemService.reorder(scheduleId, itemIds);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/gantt")
    @Operation(summary = "Get schedule items as Gantt chart tree")
    public ResponseEntity<ApiResponse<List<GanttItemResponse>>> getGantt(@PathVariable UUID scheduleId) {
        List<GanttItemResponse> gantt = itemService.getScheduleGantt(scheduleId);
        return ResponseEntity.ok(ApiResponse.ok(gantt));
    }

    @GetMapping("/critical-path")
    @Operation(summary = "Get critical path items")
    public ResponseEntity<ApiResponse<List<ScheduleItemResponse>>> getCriticalPath(
            @PathVariable UUID scheduleId) {
        List<ScheduleItemResponse> items = itemService.getCriticalPath(scheduleId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }
}
