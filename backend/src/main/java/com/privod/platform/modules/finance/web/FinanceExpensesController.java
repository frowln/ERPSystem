package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.service.BudgetService;
import com.privod.platform.modules.finance.web.dto.FinanceExpenseItemResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@Tag(name = "Finance Expenses", description = "Finance expense items endpoint (budget items enriched with contract data)")
public class FinanceExpensesController {

    private final BudgetService budgetService;

    @GetMapping("/expenses")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List finance expense items (non-section budget items) with contract and project context",
            description = "Returns budget position items enriched with primary contract information, " +
                    "budget name, and project name. Supports filtering by projectId, budgetId, " +
                    "disciplineMark (АР, ОВ, ВК, ЭОМ, etc.) and docStatus.")
    public ResponseEntity<ApiResponse<PageResponse<FinanceExpenseItemResponse>>> getExpenses(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID budgetId,
            @RequestParam(required = false) String disciplineMark,
            @RequestParam(required = false) String docStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sequence"));
        Page<FinanceExpenseItemResponse> result = budgetService.getExpenses(
                projectId, budgetId, disciplineMark, docStatus, pageable);

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result)));
    }
}
