package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contractExt.domain.ClaimStatus;
import com.privod.platform.modules.contractExt.service.ContractClaimService;
import com.privod.platform.modules.contractExt.web.dto.ContractClaimResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateClaimRequest;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/contract-claims")
@RequiredArgsConstructor
@Tag(name = "Contract Claims", description = "Претензии по договорам")
public class ContractClaimController {

    private final ContractClaimService claimService;

    @GetMapping
    @Operation(summary = "List claims by contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractClaimResponse>>> list(
            @RequestParam UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContractClaimResponse> page = claimService.listByContract(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim by ID")
    public ResponseEntity<ApiResponse<ContractClaimResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new claim")
    public ResponseEntity<ApiResponse<ContractClaimResponse>> create(
            @Valid @RequestBody CreateClaimRequest request) {
        ContractClaimResponse response = claimService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Change claim status")
    public ResponseEntity<ApiResponse<ContractClaimResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam ClaimStatus status,
            @RequestParam(required = false) String responseText) {
        return ResponseEntity.ok(ApiResponse.ok(claimService.changeStatus(id, status, responseText)));
    }
}
