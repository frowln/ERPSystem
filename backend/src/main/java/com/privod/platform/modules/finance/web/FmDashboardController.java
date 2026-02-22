package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.FmDashboardService;
import com.privod.platform.modules.finance.web.dto.FmDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/budgets/{budgetId}/dashboard")
@RequiredArgsConstructor
@Tag(name = "FM Dashboard", description = "Financial Model dashboard endpoints")
public class FmDashboardController {

    private final FmDashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get FM dashboard data")
    public ResponseEntity<ApiResponse<FmDashboardResponse>> getDashboard(@PathVariable UUID budgetId) {
        FmDashboardResponse response = dashboardService.getDashboard(budgetId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
