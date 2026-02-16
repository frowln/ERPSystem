package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contractExt.service.ContractSlaService;
import com.privod.platform.modules.contractExt.web.dto.ContractSlaResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaViolationRequest;
import com.privod.platform.modules.contractExt.web.dto.SlaViolationResponse;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/contract-slas")
@RequiredArgsConstructor
@Tag(name = "Contract SLA", description = "Соглашения об уровне обслуживания")
public class ContractSlaController {

    private final ContractSlaService slaService;

    @GetMapping
    @Operation(summary = "List SLAs by contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractSlaResponse>>> list(
            @RequestParam UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContractSlaResponse> page = slaService.listByContract(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get SLA by ID")
    public ResponseEntity<ApiResponse<ContractSlaResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(slaService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new SLA")
    public ResponseEntity<ApiResponse<ContractSlaResponse>> create(
            @Valid @RequestBody CreateSlaRequest request) {
        ContractSlaResponse response = slaService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Deactivate a SLA")
    public ResponseEntity<ApiResponse<ContractSlaResponse>> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(slaService.deactivate(id)));
    }

    // -- Violations --

    @GetMapping("/{slaId}/violations")
    @Operation(summary = "List violations for a SLA")
    public ResponseEntity<ApiResponse<PageResponse<SlaViolationResponse>>> listViolations(
            @PathVariable UUID slaId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SlaViolationResponse> page = slaService.listViolations(slaId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/violations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Record a SLA violation")
    public ResponseEntity<ApiResponse<SlaViolationResponse>> createViolation(
            @Valid @RequestBody CreateSlaViolationRequest request) {
        SlaViolationResponse response = slaService.createViolation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/violations/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Resolve a SLA violation")
    public ResponseEntity<ApiResponse<SlaViolationResponse>> resolveViolation(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(slaService.resolveViolation(id)));
    }
}
