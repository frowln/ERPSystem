package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.service.CashFlowProjectionService;
import com.privod.platform.modules.costManagement.web.dto.CashFlowProjectionResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCashFlowProjectionRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCashFlowProjectionRequest;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cash-flow-projections")
@RequiredArgsConstructor
@Tag(name = "Cash Flow Projections", description = "Cash flow projection management endpoints")
public class CashFlowProjectionController {

    private final CashFlowProjectionService cashFlowProjectionService;

    @GetMapping
    @Operation(summary = "List cash flow projections by project with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CashFlowProjectionResponse>>> list(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CashFlowProjectionResponse> page = cashFlowProjectionService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get cash flow projection by ID")
    public ResponseEntity<ApiResponse<CashFlowProjectionResponse>> getById(@PathVariable UUID id) {
        CashFlowProjectionResponse response = cashFlowProjectionService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/date-range")
    @Operation(summary = "List cash flow projections by date range")
    public ResponseEntity<ApiResponse<List<CashFlowProjectionResponse>>> listByDateRange(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CashFlowProjectionResponse> list = cashFlowProjectionService.listByDateRange(
                projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new cash flow projection")
    public ResponseEntity<ApiResponse<CashFlowProjectionResponse>> create(
            @Valid @RequestBody CreateCashFlowProjectionRequest request) {
        CashFlowProjectionResponse response = cashFlowProjectionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a cash flow projection")
    public ResponseEntity<ApiResponse<CashFlowProjectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCashFlowProjectionRequest request) {
        CashFlowProjectionResponse response = cashFlowProjectionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a cash flow projection (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        cashFlowProjectionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
