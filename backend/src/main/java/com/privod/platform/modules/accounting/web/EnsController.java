package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.service.EnsService;
import com.privod.platform.modules.accounting.web.dto.CreateEnsPaymentRequest;
import com.privod.platform.modules.accounting.web.dto.EnsAccountResponse;
import com.privod.platform.modules.accounting.web.dto.EnsPaymentResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/ens")
@RequiredArgsConstructor
@Tag(name = "ENS", description = "Unified Tax Account (Единый Налоговый Счёт) management")
public class EnsController {

    private final EnsService ensService;

    // === ENS Accounts ===

    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "List ENS accounts")
    public ResponseEntity<ApiResponse<PageResponse<EnsAccountResponse>>> listAccounts(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnsAccountResponse> page = ensService.listAccounts(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Get ENS account by ID")
    public ResponseEntity<ApiResponse<EnsAccountResponse>> getAccount(@PathVariable UUID id) {
        EnsAccountResponse response = ensService.getAccount(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Create ENS account")
    public ResponseEntity<ApiResponse<EnsAccountResponse>> createAccount(
            @RequestParam String inn) {
        EnsAccountResponse response = ensService.createAccount(inn);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Update ENS account")
    public ResponseEntity<ApiResponse<EnsAccountResponse>> updateAccount(
            @PathVariable UUID id,
            @RequestParam String inn) {
        EnsAccountResponse response = ensService.updateAccount(id, inn);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete ENS account (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable UUID id) {
        ensService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{id}/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Sync ENS account balance")
    public ResponseEntity<ApiResponse<EnsAccountResponse>> syncBalance(@PathVariable UUID id) {
        EnsAccountResponse response = ensService.syncBalance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === ENS Payments ===

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "List ENS payments")
    public ResponseEntity<ApiResponse<PageResponse<EnsPaymentResponse>>> listPayments(
            @RequestParam(required = false) UUID accountId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnsPaymentResponse> page = ensService.listPayments(accountId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create ENS payment")
    public ResponseEntity<ApiResponse<EnsPaymentResponse>> createPayment(
            @Valid @RequestBody CreateEnsPaymentRequest request) {
        EnsPaymentResponse response = ensService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update ENS payment")
    public ResponseEntity<ApiResponse<EnsPaymentResponse>> updatePayment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEnsPaymentRequest request) {
        EnsPaymentResponse response = ensService.updatePayment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete ENS payment (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePayment(@PathVariable UUID id) {
        ensService.deletePayment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/payments/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Confirm ENS payment")
    public ResponseEntity<ApiResponse<EnsPaymentResponse>> confirmPayment(@PathVariable UUID id) {
        EnsPaymentResponse response = ensService.confirmPayment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
