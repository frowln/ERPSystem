package com.privod.platform.modules.monitoring.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.monitoring.domain.HealthComponent;
import com.privod.platform.modules.monitoring.service.HealthCheckService;
import com.privod.platform.modules.monitoring.web.dto.HealthCheckResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/health")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Health Checks", description = "System health monitoring endpoints")
public class HealthController {

    private final HealthCheckService healthCheckService;

    @GetMapping("/status")
    @Operation(summary = "Get latest health status for all components")
    public ResponseEntity<ApiResponse<List<HealthCheckResponse>>> getLatestStatus() {
        List<HealthCheckResponse> status = healthCheckService.getLatestStatus();
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @PostMapping("/check-all")
    @Operation(summary = "Run health checks for all components")
    public ResponseEntity<ApiResponse<List<HealthCheckResponse>>> checkAll() {
        List<HealthCheckResponse> results = healthCheckService.checkAll();
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PostMapping("/check/{component}")
    @Operation(summary = "Run health check for a specific component")
    public ResponseEntity<ApiResponse<HealthCheckResponse>> checkComponent(
            @PathVariable HealthComponent component) {
        HealthCheckResponse result = healthCheckService.checkComponent(component);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/history/{component}")
    @Operation(summary = "Get health check history for a component")
    public ResponseEntity<ApiResponse<PageResponse<HealthCheckResponse>>> getHistory(
            @PathVariable HealthComponent component,
            @PageableDefault(size = 50, sort = "checkedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckResponse> page = healthCheckService.getHealthHistory(component, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
