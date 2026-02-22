package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.planning.service.EvmAnalyticsService;
import com.privod.platform.modules.planning.service.EvmAnalyticsService.ConfidenceBandPoint;
import com.privod.platform.modules.planning.service.EvmAnalyticsService.EacMethodsResponse;
import com.privod.platform.modules.planning.service.EvmAnalyticsService.EvmTrendPoint;
import com.privod.platform.modules.planning.service.EvmAnalyticsService.WbsEvmRow;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evm-analytics")
@RequiredArgsConstructor
@Tag(name = "EVM Analytics", description = "Расширенная аналитика освоенного объёма (P3-12)")
public class EvmAnalyticsController {

    private final EvmAnalyticsService evmAnalyticsService;

    @GetMapping("/trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Получить тренд EVM (S-кривая) для проекта")
    public ResponseEntity<ApiResponse<List<EvmTrendPoint>>> getTrend(
            @RequestParam UUID projectId) {
        List<EvmTrendPoint> trend = evmAnalyticsService.getEvmTrend(projectId);
        return ResponseEntity.ok(ApiResponse.ok(trend));
    }

    @GetMapping("/eac-methods")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Получить расчёт EAC различными методами")
    public ResponseEntity<ApiResponse<EacMethodsResponse>> getEacMethods(
            @RequestParam UUID projectId) {
        EacMethodsResponse response = evmAnalyticsService.getEacMethods(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/wbs-breakdown")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Получить EVM-разбивку по элементам WBS")
    public ResponseEntity<ApiResponse<List<WbsEvmRow>>> getWbsBreakdown(
            @RequestParam UUID projectId) {
        List<WbsEvmRow> breakdown = evmAnalyticsService.getWbsEvmBreakdown(projectId);
        return ResponseEntity.ok(ApiResponse.ok(breakdown));
    }

    @GetMapping("/confidence-bands")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Получить доверительные интервалы EVM")
    public ResponseEntity<ApiResponse<List<ConfidenceBandPoint>>> getConfidenceBands(
            @RequestParam UUID projectId) {
        List<ConfidenceBandPoint> bands = evmAnalyticsService.getConfidenceBands(projectId);
        return ResponseEntity.ok(ApiResponse.ok(bands));
    }
}
