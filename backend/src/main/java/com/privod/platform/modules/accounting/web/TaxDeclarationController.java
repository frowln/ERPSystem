package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.service.TaxDeclarationService;
import com.privod.platform.modules.accounting.web.dto.CreateTaxDeclarationRequest;
import com.privod.platform.modules.accounting.web.dto.TaxDeclarationResponse;
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
@RequestMapping("/api/tax-declarations")
@RequiredArgsConstructor
@Tag(name = "Tax Declarations", description = "Tax declaration management (VAT, profit, property, USN)")
public class TaxDeclarationController {

    private final TaxDeclarationService taxDeclarationService;

    @GetMapping
    @Operation(summary = "List tax declarations")
    public ResponseEntity<ApiResponse<PageResponse<TaxDeclarationResponse>>> list(
            @RequestParam(required = false) DeclarationType type,
            @RequestParam(required = false) DeclarationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TaxDeclarationResponse> page = taxDeclarationService.listDeclarations(type, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tax declaration by ID")
    public ResponseEntity<ApiResponse<TaxDeclarationResponse>> getById(@PathVariable UUID id) {
        TaxDeclarationResponse response = taxDeclarationService.getDeclaration(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new tax declaration")
    public ResponseEntity<ApiResponse<TaxDeclarationResponse>> create(
            @Valid @RequestBody CreateTaxDeclarationRequest request) {
        TaxDeclarationResponse response = taxDeclarationService.createDeclaration(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Submit a tax declaration")
    public ResponseEntity<ApiResponse<TaxDeclarationResponse>> submit(@PathVariable UUID id) {
        TaxDeclarationResponse response = taxDeclarationService.submitDeclaration(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Accept a submitted tax declaration")
    public ResponseEntity<ApiResponse<TaxDeclarationResponse>> accept(@PathVariable UUID id) {
        TaxDeclarationResponse response = taxDeclarationService.acceptDeclaration(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a tax declaration")
    public ResponseEntity<ApiResponse<TaxDeclarationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTaxDeclarationRequest request) {
        TaxDeclarationResponse response = taxDeclarationService.updateDeclaration(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete a tax declaration (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        taxDeclarationService.deleteDeclaration(id);
        return ResponseEntity.noContent().build();
    }
}
