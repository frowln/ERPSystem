package com.privod.platform.modules.hrRussian.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.service.EmploymentContractService;
import com.privod.platform.modules.hrRussian.web.dto.CreateEmploymentContractRequest;
import com.privod.platform.modules.hrRussian.web.dto.EmploymentContractResponse;
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
@RequestMapping("/api/hr-russian/contracts")
@RequiredArgsConstructor
@Tag(name = "Employment Contracts", description = "Трудовые договоры (РФ)")
public class EmploymentContractController {

    private final EmploymentContractService contractService;

    @GetMapping
    @Operation(summary = "List contracts with optional status filter and pagination")
    public ResponseEntity<ApiResponse<PageResponse<EmploymentContractResponse>>> list(
            @RequestParam(required = false) ContractStatus status,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EmploymentContractResponse> page = contractService.listContracts(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get contracts by employee")
    public ResponseEntity<ApiResponse<List<EmploymentContractResponse>>> getByEmployee(
            @PathVariable UUID employeeId) {
        List<EmploymentContractResponse> contracts = contractService.getByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.ok(contracts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get contract by ID")
    public ResponseEntity<ApiResponse<EmploymentContractResponse>> getById(@PathVariable UUID id) {
        EmploymentContractResponse response = contractService.getContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Create a new employment contract")
    public ResponseEntity<ApiResponse<EmploymentContractResponse>> create(
            @Valid @RequestBody CreateEmploymentContractRequest request) {
        EmploymentContractResponse response = contractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Terminate an employment contract")
    public ResponseEntity<ApiResponse<EmploymentContractResponse>> terminate(@PathVariable UUID id) {
        EmploymentContractResponse response = contractService.terminateContract(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Soft-delete a contract")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        contractService.deleteContract(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
