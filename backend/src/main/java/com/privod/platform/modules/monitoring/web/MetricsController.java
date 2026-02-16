package com.privod.platform.modules.monitoring.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.monitoring.service.SystemMetricService;
import com.privod.platform.modules.monitoring.web.dto.DashboardMetricsResponse;
import com.privod.platform.modules.monitoring.web.dto.RecordMetricRequest;
import com.privod.platform.modules.monitoring.web.dto.SystemMetricResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/metrics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Metrics", description = "System metrics monitoring endpoints")
public class MetricsController {

    private final SystemMetricService metricService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard metrics overview")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getDashboard() {
        DashboardMetricsResponse dashboard = metricService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    @GetMapping("/by-name")
    @Operation(summary = "Get metrics by name and date range")
    public ResponseEntity<ApiResponse<List<SystemMetricResponse>>> getByName(
            @RequestParam String name,
            @RequestParam Instant from,
            @RequestParam Instant to) {
        List<SystemMetricResponse> metrics = metricService.getMetrics(name, from, to);
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @PostMapping
    @Operation(summary = "Record a new metric value")
    public ResponseEntity<ApiResponse<SystemMetricResponse>> record(
            @Valid @RequestBody RecordMetricRequest request) {
        SystemMetricResponse response = metricService.record(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
