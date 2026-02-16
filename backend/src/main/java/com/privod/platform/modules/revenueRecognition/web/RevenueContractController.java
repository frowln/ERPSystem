package com.privod.platform.modules.revenueRecognition.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.service.RevenueContractService;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueContractRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueContractResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.UpdateRevenueContractRequest;
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
@RequestMapping("/api/revenue-contracts")
@RequiredArgsConstructor
@Tag(name = "Revenue Contracts", description = "Revenue contract management for ПБУ 2/2008 and ФСБУ 9/2025")
public class RevenueContractController {

    private final RevenueContractService revenueContractService;

    @GetMapping
    @Operation(summary = "List revenue contracts with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<RevenueContractResponse>>> list(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) RecognitionMethod method,
            @RequestParam(required = false) RecognitionStandard standard,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<RevenueContractResponse> page = revenueContractService.listContracts(
                organizationId, projectId, method, standard, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get revenue contract by ID")
    public ResponseEntity<ApiResponse<RevenueContractResponse>> getById(@PathVariable UUID id) {
        RevenueContractResponse response = revenueContractService.getContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new revenue contract")
    public ResponseEntity<ApiResponse<RevenueContractResponse>> create(
            @Valid @RequestBody CreateRevenueContractRequest request) {
        RevenueContractResponse response = revenueContractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update an existing revenue contract")
    public ResponseEntity<ApiResponse<RevenueContractResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRevenueContractRequest request) {
        RevenueContractResponse response = revenueContractService.updateContract(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a revenue contract")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        revenueContractService.deleteContract(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
