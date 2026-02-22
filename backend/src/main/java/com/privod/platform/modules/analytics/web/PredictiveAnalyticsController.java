package com.privod.platform.modules.analytics.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.analytics.service.PredictiveAnalyticsService;
import com.privod.platform.modules.analytics.web.dto.CreatePredictionModelRequest;
import com.privod.platform.modules.analytics.web.dto.CreateRiskFactorWeightRequest;
import com.privod.platform.modules.analytics.web.dto.PredictionModelResponse;
import com.privod.platform.modules.analytics.web.dto.ProjectRiskPredictionResponse;
import com.privod.platform.modules.analytics.web.dto.RiskDashboardResponse;
import com.privod.platform.modules.analytics.web.dto.RiskFactorWeightResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateRiskFactorWeightRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/analytics/predictions")
@RequiredArgsConstructor
@Tag(name = "Predictive Analytics", description = "Прогнозная аналитика задержек и перерасходов")
@PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','FINANCE_MANAGER')")
public class PredictiveAnalyticsController {

    private final PredictiveAnalyticsService predictiveAnalyticsService;

    // --- Dashboard ---

    @GetMapping("/dashboard")
    @Operation(summary = "Получить дашборд рисков с тепловой картой")
    public ResponseEntity<ApiResponse<RiskDashboardResponse>> getRiskDashboard() {
        RiskDashboardResponse dashboard = predictiveAnalyticsService.getRiskDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    // --- Predictions ---

    @GetMapping
    @Operation(summary = "Получить список прогнозов рисков")
    public ResponseEntity<ApiResponse<PageResponse<ProjectRiskPredictionResponse>>> getPredictions(
            @RequestParam(required = false) UUID projectId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(predictiveAnalyticsService.findPredictions(projectId, pageable))));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Получить активные оповещения о рисках")
    public ResponseEntity<ApiResponse<List<ProjectRiskPredictionResponse>>> getActiveAlerts() {
        List<ProjectRiskPredictionResponse> alerts = predictiveAnalyticsService.findActiveAlerts();
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    @PostMapping("/delay/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    @Operation(summary = "Рассчитать вероятность задержки проекта")
    public ResponseEntity<ApiResponse<ProjectRiskPredictionResponse>> calculateDelayProbability(
            @PathVariable UUID projectId) {
        ProjectRiskPredictionResponse result = predictiveAnalyticsService.calculateDelayProbability(projectId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/cost-overrun/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    @Operation(summary = "Рассчитать вероятность перерасхода бюджета проекта")
    public ResponseEntity<ApiResponse<ProjectRiskPredictionResponse>> calculateCostOverrunProbability(
            @PathVariable UUID projectId) {
        ProjectRiskPredictionResponse result = predictiveAnalyticsService.calculateCostOverrunProbability(projectId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // --- Prediction Models ---

    @GetMapping("/models")
    @Operation(summary = "Получить список моделей прогнозирования")
    public ResponseEntity<ApiResponse<PageResponse<PredictionModelResponse>>> getModels(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(predictiveAnalyticsService.findAllModels(pageable))));
    }

    @GetMapping("/models/{id}")
    @Operation(summary = "Получить модель прогнозирования по ID")
    public ResponseEntity<ApiResponse<PredictionModelResponse>> getModelById(@PathVariable UUID id) {
        PredictionModelResponse model = predictiveAnalyticsService.findModelById(id);
        return ResponseEntity.ok(ApiResponse.ok(model));
    }

    @PostMapping("/models")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    @Operation(summary = "Создать модель прогнозирования")
    public ResponseEntity<ApiResponse<PredictionModelResponse>> createModel(
            @Valid @RequestBody CreatePredictionModelRequest request) {
        PredictionModelResponse result = predictiveAnalyticsService.createModel(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/models/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить модель прогнозирования")
    public ResponseEntity<ApiResponse<Void>> deleteModel(@PathVariable UUID id) {
        predictiveAnalyticsService.deleteModel(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Risk Factor Weights ---

    @GetMapping("/weights")
    @Operation(summary = "Получить весовые коэффициенты факторов риска")
    public ResponseEntity<ApiResponse<PageResponse<RiskFactorWeightResponse>>> getWeights(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.of(predictiveAnalyticsService.findAllWeights(pageable))));
    }

    @PostMapping("/weights")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    @Operation(summary = "Создать весовой коэффициент фактора риска")
    public ResponseEntity<ApiResponse<RiskFactorWeightResponse>> createWeight(
            @Valid @RequestBody CreateRiskFactorWeightRequest request) {
        RiskFactorWeightResponse result = predictiveAnalyticsService.createWeight(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/weights/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    @Operation(summary = "Обновить весовой коэффициент фактора риска")
    public ResponseEntity<ApiResponse<RiskFactorWeightResponse>> updateWeight(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRiskFactorWeightRequest request) {
        RiskFactorWeightResponse result = predictiveAnalyticsService.updateWeight(id, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/weights/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить весовой коэффициент фактора риска")
    public ResponseEntity<ApiResponse<Void>> deleteWeight(@PathVariable UUID id) {
        predictiveAnalyticsService.deleteWeight(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
