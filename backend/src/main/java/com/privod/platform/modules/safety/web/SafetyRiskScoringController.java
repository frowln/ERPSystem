package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetyRiskScoringService;
import com.privod.platform.modules.safety.web.dto.PortfolioRiskMapResponse;
import com.privod.platform.modules.safety.web.dto.SafetyRiskFactorResponse;
import com.privod.platform.modules.safety.web.dto.SafetyRiskScoreResponse;
import com.privod.platform.modules.safety.web.dto.WeeklyRiskReportResponse;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/safety/risk-scoring")
@RequiredArgsConstructor
@Tag(name = "Safety Risk Scoring", description = "AI-powered safety risk scoring engine")
public class SafetyRiskScoringController {

    private final SafetyRiskScoringService riskScoringService;

    @GetMapping("/{projectId}")
    @Operation(summary = "Get current risk score for a project")
    public ResponseEntity<ApiResponse<SafetyRiskScoreResponse>> getProjectRiskScore(
            @PathVariable UUID projectId) {
        SafetyRiskScoreResponse response = riskScoringService.getProjectRiskScore(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{projectId}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Trigger risk score recalculation for a project")
    public ResponseEntity<ApiResponse<SafetyRiskScoreResponse>> calculateProjectRiskScore(
            @PathVariable UUID projectId) {
        SafetyRiskScoreResponse response = riskScoringService.calculateProjectRiskScore(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/portfolio")
    @Operation(summary = "Get portfolio-wide risk map with all project scores")
    public ResponseEntity<ApiResponse<PortfolioRiskMapResponse>> getPortfolioRiskMap() {
        PortfolioRiskMapResponse response = riskScoringService.getPortfolioRiskMap();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{projectId}/factors")
    @Operation(summary = "Get risk factor breakdown for a project")
    public ResponseEntity<ApiResponse<List<SafetyRiskFactorResponse>>> getProjectFactors(
            @PathVariable UUID projectId) {
        List<SafetyRiskFactorResponse> response = riskScoringService.getProjectFactors(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/calculate-all")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Recalculate risk scores for all active projects")
    public ResponseEntity<ApiResponse<Void>> calculateAllProjects() {
        riskScoringService.calculateAllProjects();
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/reports")
    @Operation(summary = "Get weekly risk report history")
    public ResponseEntity<ApiResponse<PageResponse<WeeklyRiskReportResponse>>> getWeeklyReports(
            @PageableDefault(size = 20, sort = "reportWeek", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WeeklyRiskReportResponse> page = riskScoringService.getWeeklyReports(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/reports/generate")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Trigger weekly risk report generation")
    public ResponseEntity<ApiResponse<WeeklyRiskReportResponse>> generateWeeklyReport() {
        WeeklyRiskReportResponse response = riskScoringService.generateWeeklyReport();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
