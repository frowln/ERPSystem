package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.finance.service.CostCodeService;
import com.privod.platform.modules.finance.web.dto.CostCodeResponse;
import com.privod.platform.modules.finance.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.finance.web.dto.UpdateCostCodeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

@RestController("financeCostCodeController")
@RequestMapping("/api/finance/cost-codes")
@RequiredArgsConstructor
@Tag(name = "Finance Cost Codes", description = "Cost code management (CSI / GESN / Custom)")
public class CostCodeController {

    private final CostCodeService costCodeService;

    @GetMapping
    @Operation(summary = "List cost codes (flat), optionally filtered by parentId")
    public ResponseEntity<ApiResponse<List<CostCodeResponse>>> list(
            @RequestParam(required = false) UUID parentId) {
        List<CostCodeResponse> result = costCodeService.getAllCostCodes(parentId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/tree")
    @Operation(summary = "Get cost codes as hierarchical tree")
    public ResponseEntity<ApiResponse<List<CostCodeResponse>>> tree() {
        List<CostCodeResponse> result = costCodeService.getTree();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single cost code by ID")
    public ResponseEntity<ApiResponse<CostCodeResponse>> getById(@PathVariable UUID id) {
        CostCodeResponse result = costCodeService.getCostCode(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new cost code")
    public ResponseEntity<ApiResponse<CostCodeResponse>> create(
            @Valid @RequestBody CreateCostCodeRequest request) {
        CostCodeResponse result = costCodeService.createCostCode(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Update a cost code")
    public ResponseEntity<ApiResponse<CostCodeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCostCodeRequest request) {
        CostCodeResponse result = costCodeService.updateCostCode(id, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a cost code")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        costCodeService.deleteCostCode(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/seed/{standard}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Seed standard cost codes (CSI or GESN)")
    public ResponseEntity<ApiResponse<Void>> seed(@PathVariable String standard) {
        costCodeService.seedStandard(standard);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
