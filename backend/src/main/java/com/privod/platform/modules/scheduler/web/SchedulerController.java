package com.privod.platform.modules.scheduler.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.scheduler.service.SchedulerService;
import com.privod.platform.modules.scheduler.web.dto.CreateScheduledJobRequest;
import com.privod.platform.modules.scheduler.web.dto.JobExecutionResponse;
import com.privod.platform.modules.scheduler.web.dto.ScheduledJobResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scheduler")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN')")
@Tag(name = "Scheduler", description = "Scheduled job management")
public class SchedulerController {

    private final SchedulerService schedulerService;

    @PostMapping("/jobs")
    @Operation(summary = "Register a new scheduled job")
    public ResponseEntity<ApiResponse<ScheduledJobResponse>> register(
            @Valid @RequestBody CreateScheduledJobRequest request) {
        ScheduledJobResponse response = schedulerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/jobs")
    @Operation(summary = "List all scheduled jobs")
    public ResponseEntity<ApiResponse<PageResponse<ScheduledJobResponse>>> listJobs(
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<ScheduledJobResponse> page = schedulerService.listJobs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/jobs/{code}")
    @Operation(summary = "Get a scheduled job by code")
    public ResponseEntity<ApiResponse<ScheduledJobResponse>> getJob(@PathVariable String code) {
        ScheduledJobResponse response = schedulerService.getJob(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/jobs/{code}/enable")
    @Operation(summary = "Enable a scheduled job")
    public ResponseEntity<ApiResponse<ScheduledJobResponse>> enable(@PathVariable String code) {
        ScheduledJobResponse response = schedulerService.enable(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/jobs/{code}/disable")
    @Operation(summary = "Disable a scheduled job")
    public ResponseEntity<ApiResponse<ScheduledJobResponse>> disable(@PathVariable String code) {
        ScheduledJobResponse response = schedulerService.disable(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/jobs/{code}/run")
    @Operation(summary = "Trigger manual execution of a scheduled job")
    public ResponseEntity<ApiResponse<JobExecutionResponse>> triggerRun(@PathVariable String code) {
        JobExecutionResponse response = schedulerService.triggerManualRun(code);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/jobs/{code}/executions")
    @Operation(summary = "List executions of a scheduled job")
    public ResponseEntity<ApiResponse<PageResponse<JobExecutionResponse>>> listExecutions(
            @PathVariable String code,
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<JobExecutionResponse> page = schedulerService.getExecutions(code, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
