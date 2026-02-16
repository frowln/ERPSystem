package com.privod.platform.modules.calendar.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.calendar.service.ConstructionScheduleService;
import com.privod.platform.modules.calendar.web.dto.ConstructionScheduleResponse;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateScheduleRequest;
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
@RequestMapping("/api/calendar/schedules")
@RequiredArgsConstructor
@Tag(name = "Construction Schedules", description = "Construction schedule management endpoints")
public class ConstructionScheduleController {

    private final ConstructionScheduleService scheduleService;

    @GetMapping
    @Operation(summary = "List construction schedules")
    public ResponseEntity<ApiResponse<PageResponse<ConstructionScheduleResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ConstructionScheduleResponse> page = scheduleService.listSchedules(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get construction schedule by ID")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> getById(@PathVariable UUID id) {
        ConstructionScheduleResponse response = scheduleService.getSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Create a new construction schedule")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> create(
            @Valid @RequestBody CreateScheduleRequest request) {
        ConstructionScheduleResponse response = scheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a construction schedule")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateScheduleRequest request) {
        ConstructionScheduleResponse response = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a construction schedule")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve a construction schedule")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> approve(@PathVariable UUID id) {
        ConstructionScheduleResponse response = scheduleService.approve(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Activate an approved construction schedule")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> activate(@PathVariable UUID id) {
        ConstructionScheduleResponse response = scheduleService.activate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get all schedules for a project")
    public ResponseEntity<ApiResponse<List<ConstructionScheduleResponse>>> getProjectSchedules(
            @PathVariable UUID projectId) {
        List<ConstructionScheduleResponse> schedules = scheduleService.getProjectSchedules(projectId);
        return ResponseEntity.ok(ApiResponse.ok(schedules));
    }

    @GetMapping("/project/{projectId}/active")
    @Operation(summary = "Get the active schedule for a project")
    public ResponseEntity<ApiResponse<ConstructionScheduleResponse>> getActiveSchedule(
            @PathVariable UUID projectId) {
        ConstructionScheduleResponse response = scheduleService.getActiveSchedule(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
