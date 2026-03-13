package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.service.CashFlowService;
import com.privod.platform.modules.finance.web.dto.CashFlowEntryResponse;
import com.privod.platform.modules.finance.web.dto.CashFlowSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateCashFlowEntryRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cash-flow")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
@Tag(name = "Cash Flow", description = "Cash flow management endpoints")
public class CashFlowController {

    private final CashFlowService cashFlowService;

    @GetMapping
    @Operation(summary = "List cash flow entries with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<CashFlowEntryResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "entryDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CashFlowEntryResponse> page = cashFlowService.listEntries(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get cash flow entry by ID")
    public ResponseEntity<ApiResponse<CashFlowEntryResponse>> getById(@PathVariable UUID id) {
        CashFlowEntryResponse response = cashFlowService.getEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new cash flow entry")
    public ResponseEntity<ApiResponse<CashFlowEntryResponse>> create(
            @Valid @RequestBody CreateCashFlowEntryRequest request) {
        CashFlowEntryResponse response = cashFlowService.createEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete a cash flow entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        cashFlowService.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get project cash flow entries within date range")
    public ResponseEntity<ApiResponse<List<CashFlowEntryResponse>>> getProjectCashFlow(
            @PathVariable UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        List<CashFlowEntryResponse> entries = cashFlowService.getProjectCashFlow(projectId, dateFrom, dateTo);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get project cash flow summary with monthly breakdown")
    public ResponseEntity<ApiResponse<CashFlowSummaryResponse>> getSummary(
            @RequestParam UUID projectId) {
        CashFlowSummaryResponse response = cashFlowService.getCashFlowSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Generate forecast cash flow entries from project budget")
    public ResponseEntity<ApiResponse<List<CashFlowEntryResponse>>> generateForecast(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "30") int paymentDelayDays,
            @RequestParam(defaultValue = "true") boolean includeVat) {
        List<CashFlowEntryResponse> entries = cashFlowService.generateForecast(
                projectId, startDate, endDate, paymentDelayDays, includeVat);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(entries));
    }
}
