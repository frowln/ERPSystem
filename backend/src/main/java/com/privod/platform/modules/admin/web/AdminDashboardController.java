package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.admin.service.AdminDashboardService;
import com.privod.platform.modules.admin.web.dto.DashboardMetricsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Dashboard", description = "Admin dashboard metrics")
public class AdminDashboardController {
    private final AdminDashboardService dashboardService;

    @GetMapping("/metrics")
    @Operation(summary = "Get dashboard metrics")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getMetrics()));
    }
}
