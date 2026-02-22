package com.privod.platform.modules.changeManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.changeManagement.service.ChangeManagementAnalyticsService;
import com.privod.platform.modules.changeManagement.service.ChangeManagementAnalyticsService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/change-management/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','CONTRACT_MANAGER','FINANCE_MANAGER')")
public class ChangeManagementAnalyticsController {

    private final ChangeManagementAnalyticsService analyticsService;

    @GetMapping("/schedule-impact")
    public ResponseEntity<ApiResponse<ScheduleImpactAnalysis>> getScheduleImpact(@RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getScheduleImpact(projectId)));
    }

    @GetMapping("/budget-impact")
    public ResponseEntity<ApiResponse<BudgetImpactSummary>> getBudgetImpact(@RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getBudgetImpact(projectId)));
    }

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<TrendAnalysis>> getTrends(@RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getTrends(projectId)));
    }
}
