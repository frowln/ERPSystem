package com.privod.platform.modules.selfEmployed.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.RegistryStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPaymentStatus;
import com.privod.platform.modules.selfEmployed.service.SelfEmployedService;
import com.privod.platform.modules.selfEmployed.web.dto.ContractorResponse;
import com.privod.platform.modules.selfEmployed.web.dto.CreateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateSelfEmployedPaymentRequest;
import com.privod.platform.modules.selfEmployed.web.dto.GenerateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.RegistryResponse;
import com.privod.platform.modules.selfEmployed.web.dto.SelfEmployedPaymentResponse;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateSelfEmployedPaymentRequest;
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
@RequestMapping("/api/self-employed")
@RequiredArgsConstructor
@Tag(name = "Self-Employed", description = "Self-employed contractor, payment and registry management endpoints")
public class SelfEmployedController {

    private final SelfEmployedService selfEmployedService;

    // ---- Contractor endpoints ----

    @GetMapping("/contractors")
    @Operation(summary = "List self-employed contractors with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<ContractorResponse>>> listContractors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ContractorStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ContractorResponse> page = selfEmployedService.listContractors(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/contractors/{id}")
    @Operation(summary = "Get self-employed contractor by ID")
    public ResponseEntity<ApiResponse<ContractorResponse>> getContractor(@PathVariable UUID id) {
        ContractorResponse response = selfEmployedService.getContractor(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/contractors")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Register a new self-employed contractor")
    public ResponseEntity<ApiResponse<ContractorResponse>> createContractor(
            @Valid @RequestBody CreateContractorRequest request) {
        ContractorResponse response = selfEmployedService.createContractor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/contractors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a self-employed contractor")
    public ResponseEntity<ApiResponse<ContractorResponse>> updateContractor(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateContractorRequest request) {
        ContractorResponse response = selfEmployedService.updateContractor(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/contractors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a self-employed contractor")
    public ResponseEntity<ApiResponse<Void>> deleteContractor(@PathVariable UUID id) {
        selfEmployedService.deleteContractor(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Payment endpoints ----

    @GetMapping("/payments")
    @Operation(summary = "List self-employed payments with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<SelfEmployedPaymentResponse>>> listPayments(
            @RequestParam(required = false) UUID contractorId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) SelfEmployedPaymentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<SelfEmployedPaymentResponse> page = selfEmployedService.listPayments(
                contractorId, projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/payments/{id}")
    @Operation(summary = "Get self-employed payment by ID")
    public ResponseEntity<ApiResponse<SelfEmployedPaymentResponse>> getPayment(@PathVariable UUID id) {
        SelfEmployedPaymentResponse response = selfEmployedService.getPayment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new self-employed payment")
    public ResponseEntity<ApiResponse<SelfEmployedPaymentResponse>> createPayment(
            @Valid @RequestBody CreateSelfEmployedPaymentRequest request) {
        SelfEmployedPaymentResponse response = selfEmployedService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a self-employed payment")
    public ResponseEntity<ApiResponse<SelfEmployedPaymentResponse>> updatePayment(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSelfEmployedPaymentRequest request) {
        SelfEmployedPaymentResponse response = selfEmployedService.updatePayment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a self-employed payment")
    public ResponseEntity<ApiResponse<Void>> deletePayment(@PathVariable UUID id) {
        selfEmployedService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/payments/{id}/check-receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Verify fiscal receipt for a self-employed payment")
    public ResponseEntity<ApiResponse<SelfEmployedPaymentResponse>> checkReceipt(@PathVariable UUID id) {
        SelfEmployedPaymentResponse response = selfEmployedService.checkFiscalReceipt(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Registry endpoints ----

    @GetMapping("/registries")
    @Operation(summary = "List self-employed payment registries with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<RegistryResponse>>> listRegistries(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) RegistryStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<RegistryResponse> page = selfEmployedService.listRegistries(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/registries/{id}")
    @Operation(summary = "Get self-employed payment registry by ID")
    public ResponseEntity<ApiResponse<RegistryResponse>> getRegistry(@PathVariable UUID id) {
        RegistryResponse response = selfEmployedService.getRegistry(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/registries")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new self-employed payment registry")
    public ResponseEntity<ApiResponse<RegistryResponse>> createRegistry(
            @Valid @RequestBody CreateRegistryRequest request) {
        RegistryResponse response = selfEmployedService.createRegistry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/registries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a self-employed payment registry")
    public ResponseEntity<ApiResponse<Void>> deleteRegistry(@PathVariable UUID id) {
        selfEmployedService.deleteRegistry(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/registries/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Generate a registry from payments for a project and period")
    public ResponseEntity<ApiResponse<RegistryResponse>> generateRegistry(
            @Valid @RequestBody GenerateRegistryRequest request) {
        RegistryResponse response = selfEmployedService.generateRegistry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/registries/{id}/export")
    @Operation(summary = "Export registry payments for download")
    public ResponseEntity<ApiResponse<List<SelfEmployedPaymentResponse>>> exportRegistry(
            @PathVariable UUID id) {
        List<SelfEmployedPaymentResponse> payments = selfEmployedService.exportRegistry(id);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }
}
