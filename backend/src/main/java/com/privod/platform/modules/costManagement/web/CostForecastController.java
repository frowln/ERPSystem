package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.service.CostForecastService;
import com.privod.platform.modules.costManagement.web.dto.CostForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostForecastRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cost-forecasts")
@RequiredArgsConstructor
@Tag(name = "Cost Forecasts / EVM", description = "Cost forecast and Earned Value Management endpoints")
public class CostForecastController {

    private final CostForecastService costForecastService;

    @GetMapping
    @Operation(summary = "List cost forecasts by project with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CostForecastResponse>>> list(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "forecastDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CostForecastResponse> page = costForecastService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get cost forecast by ID")
    public ResponseEntity<ApiResponse<CostForecastResponse>> getById(@PathVariable UUID id) {
        CostForecastResponse response = costForecastService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/latest")
    @Operation(summary = "Get the latest cost forecast for a project")
    public ResponseEntity<ApiResponse<CostForecastResponse>> getLatest(@RequestParam UUID projectId) {
        CostForecastResponse response = costForecastService.getLatest(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/date-range")
    @Operation(summary = "List cost forecasts by date range")
    public ResponseEntity<ApiResponse<List<CostForecastResponse>>> listByDateRange(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CostForecastResponse> list = costForecastService.listByDateRange(projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Create a new cost forecast with EVM calculations")
    public ResponseEntity<ApiResponse<CostForecastResponse>> create(
            @Valid @RequestBody CreateCostForecastRequest request) {
        CostForecastResponse response = costForecastService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/snapshot")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Create an EVM snapshot for a project")
    public ResponseEntity<ApiResponse<CostForecastResponse>> createSnapshot(
            @RequestParam UUID projectId,
            @RequestParam BigDecimal bac,
            @RequestParam BigDecimal ev,
            @RequestParam BigDecimal pv,
            @RequestParam BigDecimal ac,
            @RequestParam(required = false) BigDecimal percentComplete,
            @RequestParam(required = false) String notes) {
        CostForecastResponse response = costForecastService.createSnapshot(
                projectId, bac, ev, pv, ac, percentComplete, notes);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Update a cost forecast")
    public ResponseEntity<ApiResponse<CostForecastResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCostForecastRequest request) {
        CostForecastResponse response = costForecastService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a cost forecast (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        costForecastService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
