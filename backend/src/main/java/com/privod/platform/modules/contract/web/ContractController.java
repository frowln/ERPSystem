package com.privod.platform.modules.contract.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contract.domain.ContractDirection;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.service.ContractService;
import com.privod.platform.modules.contract.web.dto.ApproveContractRequest;
import com.privod.platform.modules.contract.web.dto.ChangeContractStatusRequest;
import com.privod.platform.modules.contract.web.dto.ContractApprovalResponse;
import com.privod.platform.modules.contract.web.dto.ContractDashboardResponse;
import com.privod.platform.modules.contract.web.dto.ContractResponse;
import com.privod.platform.modules.contract.web.dto.ContractTypeResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractRequest;
import com.privod.platform.modules.contract.web.dto.RejectContractRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractRequest;
import com.privod.platform.modules.contract.service.ContractTypeService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "Contracts", description = "Contract management endpoints")
public class ContractController {

    private final ContractService contractService;
    private final ContractTypeService contractTypeService;

    @GetMapping
    @Operation(summary = "List contracts with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<ContractResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID partnerId,
            @RequestParam(required = false) ContractDirection direction,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ContractResponse> page = contractService.listContracts(search, status, projectId, partnerId, direction, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get contract by ID")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable UUID id) {
        ContractResponse response = contractService.getContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new contract")
    public ResponseEntity<ApiResponse<ContractResponse>> create(
            @Valid @RequestBody CreateContractRequest request) {
        ContractResponse response = contractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Update an existing contract")
    public ResponseEntity<ApiResponse<ContractResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateContractRequest request) {
        ContractResponse response = contractService.updateContract(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Change contract status")
    public ResponseEntity<ApiResponse<ContractResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeContractStatusRequest request) {
        ContractResponse response = contractService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Submit contract for approval")
    public ResponseEntity<ApiResponse<ContractResponse>> submitForApproval(@PathVariable UUID id) {
        ContractResponse response = contractService.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'FINANCE_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve contract at a specific stage")
    public ResponseEntity<ApiResponse<ContractResponse>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveContractRequest request) {
        ContractResponse response = contractService.approveContract(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'FINANCE_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Reject contract at a specific stage")
    public ResponseEntity<ApiResponse<ContractResponse>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectContractRequest request) {
        ContractResponse response = contractService.rejectContract(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Sign an approved contract")
    public ResponseEntity<ApiResponse<ContractResponse>> sign(@PathVariable UUID id) {
        ContractResponse response = contractService.signContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Activate a signed contract")
    public ResponseEntity<ApiResponse<ContractResponse>> activate(@PathVariable UUID id) {
        ContractResponse response = contractService.activateContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Close an active contract")
    public ResponseEntity<ApiResponse<ContractResponse>> close(@PathVariable UUID id) {
        ContractResponse response = contractService.closeContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/version")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new version of the contract")
    public ResponseEntity<ApiResponse<ContractResponse>> createVersion(
            @PathVariable UUID id,
            @RequestParam(required = false) String comment) {
        ContractResponse response = contractService.createVersion(id, comment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/approvals")
    @Operation(summary = "Get approval history for a contract")
    public ResponseEntity<ApiResponse<List<ContractApprovalResponse>>> getApprovals(@PathVariable UUID id) {
        List<ContractApprovalResponse> approvals = contractService.getApprovals(id);
        return ResponseEntity.ok(ApiResponse.ok(approvals));
    }

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Get contract dashboard summary statistics")
    public ResponseEntity<ApiResponse<ContractDashboardResponse>> getDashboardSummary(
            @RequestParam(required = false) UUID projectId) {
        ContractDashboardResponse response = contractService.getDashboardSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/types")
    @Operation(summary = "List active contract types")
    public ResponseEntity<ApiResponse<List<ContractTypeResponse>>> listTypes() {
        List<ContractTypeResponse> types = contractTypeService.listTypes();
        return ResponseEntity.ok(ApiResponse.ok(types));
    }
}
