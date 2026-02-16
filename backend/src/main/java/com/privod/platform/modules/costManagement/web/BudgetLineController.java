package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.service.BudgetLineService;
import com.privod.platform.modules.costManagement.web.dto.BudgetLineResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateBudgetLineRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateBudgetLineRequest;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budget-lines")
@RequiredArgsConstructor
@Tag(name = "Budget Lines", description = "Budget line management endpoints")
public class BudgetLineController {

    private final BudgetLineService budgetLineService;

    @GetMapping
    @Operation(summary = "List budget lines by project with pagination")
    public ResponseEntity<ApiResponse<PageResponse<BudgetLineResponse>>> list(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<BudgetLineResponse> page = budgetLineService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/all")
    @Operation(summary = "List all budget lines by project (no pagination)")
    public ResponseEntity<ApiResponse<List<BudgetLineResponse>>> listAll(@RequestParam UUID projectId) {
        List<BudgetLineResponse> list = budgetLineService.listAllByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget line by ID")
    public ResponseEntity<ApiResponse<BudgetLineResponse>> getById(@PathVariable UUID id) {
        BudgetLineResponse response = budgetLineService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/summary/original-budget")
    @Operation(summary = "Get total original budget for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOriginalBudget(@RequestParam UUID projectId) {
        BigDecimal total = budgetLineService.getTotalOriginalBudget(projectId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }

    @GetMapping("/summary/revised-budget")
    @Operation(summary = "Get total revised budget for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevisedBudget(@RequestParam UUID projectId) {
        BigDecimal total = budgetLineService.getTotalRevisedBudget(projectId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }

    @GetMapping("/summary/actual-cost")
    @Operation(summary = "Get total actual cost for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalActualCost(@RequestParam UUID projectId) {
        BigDecimal total = budgetLineService.getTotalActualCost(projectId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }

    @GetMapping("/summary/variance")
    @Operation(summary = "Get total variance for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalVariance(@RequestParam UUID projectId) {
        BigDecimal total = budgetLineService.getTotalVariance(projectId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new budget line")
    public ResponseEntity<ApiResponse<BudgetLineResponse>> create(
            @Valid @RequestBody CreateBudgetLineRequest request) {
        BudgetLineResponse response = budgetLineService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a budget line")
    public ResponseEntity<ApiResponse<BudgetLineResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBudgetLineRequest request) {
        BudgetLineResponse response = budgetLineService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a budget line (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        budgetLineService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
