package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.service.BudgetService;
import com.privod.platform.modules.finance.web.dto.BudgetItemResponse;
import com.privod.platform.modules.finance.web.dto.BudgetResponse;
import com.privod.platform.modules.finance.web.dto.BudgetSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.CreateBudgetRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Budget management endpoints")
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    @Operation(summary = "List budgets with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<BudgetResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) BudgetStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<BudgetResponse> page = budgetService.listBudgets(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget by ID")
    public ResponseEntity<ApiResponse<BudgetResponse>> getById(@PathVariable UUID id) {
        BudgetResponse response = budgetService.getBudget(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            @Valid @RequestBody CreateBudgetRequest request) {
        BudgetResponse response = budgetService.createBudget(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update an existing budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBudgetRequest request) {
        BudgetResponse response = budgetService.updateBudget(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve a budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> approve(@PathVariable UUID id) {
        BudgetResponse response = budgetService.approveBudget(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Activate an approved budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> activate(@PathVariable UUID id) {
        BudgetResponse response = budgetService.activateBudget(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/freeze")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Freeze an active budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> freeze(@PathVariable UUID id) {
        BudgetResponse response = budgetService.freezeBudget(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Close a budget")
    public ResponseEntity<ApiResponse<BudgetResponse>> close(@PathVariable UUID id) {
        BudgetResponse response = budgetService.closeBudget(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/recalculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Recalculate actual amounts from budget items")
    public ResponseEntity<ApiResponse<BudgetResponse>> recalculate(@PathVariable UUID id) {
        BudgetResponse response = budgetService.recalculateActuals(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get project budget summary")
    public ResponseEntity<ApiResponse<BudgetSummaryResponse>> getSummary(
            @RequestParam UUID projectId) {
        BudgetSummaryResponse response = budgetService.getProjectBudgetSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Budget Items ===

    @GetMapping("/{budgetId}/items")
    @Operation(summary = "Get all items of a budget")
    public ResponseEntity<ApiResponse<List<BudgetItemResponse>>> getItems(@PathVariable UUID budgetId) {
        List<BudgetItemResponse> items = budgetService.getBudgetItems(budgetId);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{budgetId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Add an item to a budget")
    public ResponseEntity<ApiResponse<BudgetItemResponse>> addItem(
            @PathVariable UUID budgetId,
            @Valid @RequestBody CreateBudgetItemRequest request) {
        BudgetItemResponse response = budgetService.addBudgetItem(budgetId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{budgetId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a budget item")
    public ResponseEntity<ApiResponse<BudgetItemResponse>> updateItem(
            @PathVariable UUID budgetId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateBudgetItemRequest request) {
        BudgetItemResponse response = budgetService.updateBudgetItem(budgetId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{budgetId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete a budget item")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID budgetId,
            @PathVariable UUID itemId) {
        budgetService.deleteBudgetItem(budgetId, itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
