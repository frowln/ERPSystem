package com.privod.platform.modules.planfact.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.planfact.service.PlanFactService;
import com.privod.platform.modules.planfact.web.dto.PlanFactLineResponse;
import com.privod.platform.modules.planfact.web.dto.PlanFactSummaryResponse;
import com.privod.platform.modules.planfact.web.dto.UpdatePlanFactLineRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plan-fact")
@RequiredArgsConstructor
@Tag(name = "План-факт", description = "Плановые и фактические показатели проекта")
public class PlanFactController {

    private final PlanFactService planFactService;

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Получить план-факт строки проекта")
    public ResponseEntity<ApiResponse<List<PlanFactLineResponse>>> getProjectPlanFact(
            @PathVariable UUID projectId) {
        List<PlanFactLineResponse> lines = planFactService.getProjectPlanFact(projectId);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping("/project/{projectId}/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Сгенерировать план-факт строки для проекта")
    public ResponseEntity<ApiResponse<List<PlanFactLineResponse>>> generateLines(
            @PathVariable UUID projectId) {
        List<PlanFactLineResponse> lines = planFactService.generatePlanFactLines(projectId);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PutMapping("/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Обновить строку план-факта")
    public ResponseEntity<ApiResponse<PlanFactLineResponse>> updateLine(
            @PathVariable UUID lineId,
            @Valid @RequestBody UpdatePlanFactLineRequest request) {
        PlanFactLineResponse response = planFactService.updateLine(lineId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}/summary")
    @Operation(summary = "Получить сводку план-факта по проекту")
    public ResponseEntity<ApiResponse<PlanFactSummaryResponse>> getProjectSummary(
            @PathVariable UUID projectId) {
        PlanFactSummaryResponse summary = planFactService.getProjectSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
