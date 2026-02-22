package com.privod.platform.modules.contract.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.contract.service.ContractBudgetItemService;
import com.privod.platform.modules.contract.web.dto.BudgetItemCoverageResponse;
import com.privod.platform.modules.contract.web.dto.ContractBudgetItemResponse;
import com.privod.platform.modules.contract.web.dto.LinkBudgetItemsRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractBudgetItemRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Contract Budget Items", description = "Link contracts to financial model positions")
public class ContractBudgetItemController {

    private final ContractBudgetItemService service;

    @PostMapping("/api/contracts/{contractId}/budget-items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Link budget items to contract")
    public ResponseEntity<ApiResponse<List<ContractBudgetItemResponse>>> link(
            @PathVariable UUID contractId,
            @Valid @RequestBody LinkBudgetItemsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.linkBudgetItems(contractId, request)));
    }

    @GetMapping("/api/contracts/{contractId}/budget-items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get linked budget items for contract")
    public ResponseEntity<ApiResponse<List<ContractBudgetItemResponse>>> getLinked(
            @PathVariable UUID contractId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getLinkedItems(contractId)));
    }

    @DeleteMapping("/api/contracts/{contractId}/budget-items/{linkId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Unlink a budget item from contract")
    public ResponseEntity<ApiResponse<Void>> unlink(
            @PathVariable UUID contractId, @PathVariable UUID linkId) {
        service.unlinkBudgetItem(contractId, linkId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PutMapping("/api/contracts/{contractId}/budget-items/{linkId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update linked budget item allocation")
    public ResponseEntity<ApiResponse<ContractBudgetItemResponse>> updateLinkedItem(
            @PathVariable UUID contractId,
            @PathVariable UUID linkId,
            @Valid @RequestBody UpdateContractBudgetItemRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateLinkedItem(contractId, linkId, request)));
    }

    @GetMapping("/api/budget-items/{budgetItemId}/contracts")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get all contracts for a budget item")
    public ResponseEntity<ApiResponse<List<ContractBudgetItemResponse>>> getContracts(
            @PathVariable UUID budgetItemId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getContractsForBudgetItem(budgetItemId)));
    }

    @GetMapping("/api/budget-items/{budgetItemId}/coverage")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get coverage percentage for budget item")
    public ResponseEntity<ApiResponse<BudgetItemCoverageResponse>> getCoverage(
            @PathVariable UUID budgetItemId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getCoverage(budgetItemId)));
    }
}
