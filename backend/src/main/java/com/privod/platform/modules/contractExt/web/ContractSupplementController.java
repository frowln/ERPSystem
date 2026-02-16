package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.contractExt.service.ContractSupplementService;
import com.privod.platform.modules.contractExt.web.dto.ContractSupplementResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSupplementRequest;
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
@RequestMapping("/api/contract-supplements")
@RequiredArgsConstructor
@Tag(name = "Contract Supplements", description = "Дополнительные соглашения к договорам")
public class ContractSupplementController {

    private final ContractSupplementService supplementService;

    @GetMapping
    @Operation(summary = "List supplements by contract")
    public ResponseEntity<ApiResponse<PageResponse<ContractSupplementResponse>>> list(
            @RequestParam UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ContractSupplementResponse> page = supplementService.listByContract(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplement by ID")
    public ResponseEntity<ApiResponse<ContractSupplementResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(supplementService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new supplement")
    public ResponseEntity<ApiResponse<ContractSupplementResponse>> create(
            @Valid @RequestBody CreateSupplementRequest request) {
        ContractSupplementResponse response = supplementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Approve a supplement")
    public ResponseEntity<ApiResponse<ContractSupplementResponse>> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(supplementService.approve(id)));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Sign a supplement")
    public ResponseEntity<ApiResponse<ContractSupplementResponse>> sign(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(supplementService.sign(id)));
    }
}
