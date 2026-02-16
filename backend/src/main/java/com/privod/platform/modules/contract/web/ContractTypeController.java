package com.privod.platform.modules.contract.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.contract.service.ContractTypeService;
import com.privod.platform.modules.contract.web.dto.ContractTypeResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractTypeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contract-types")
@RequiredArgsConstructor
@Tag(name = "Contract Types", description = "Contract type management endpoints")
public class ContractTypeController {

    private final ContractTypeService contractTypeService;

    @GetMapping
    @Operation(summary = "List all active contract types")
    public ResponseEntity<ApiResponse<List<ContractTypeResponse>>> list() {
        List<ContractTypeResponse> types = contractTypeService.listTypes();
        return ResponseEntity.ok(ApiResponse.ok(types));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new contract type")
    public ResponseEntity<ApiResponse<ContractTypeResponse>> create(
            @Valid @RequestBody CreateContractTypeRequest request) {
        ContractTypeResponse response = contractTypeService.createType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a contract type")
    public ResponseEntity<ApiResponse<ContractTypeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateContractTypeRequest request) {
        ContractTypeResponse response = contractTypeService.updateType(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
