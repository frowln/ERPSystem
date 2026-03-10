package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.service.CostCodeService;
import com.privod.platform.modules.costManagement.web.dto.CostCodeResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostCodeRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCostCodeRequest;
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

@RestController("costMgmtCostCodeController")
@RequestMapping("/api/cost-codes")
@RequiredArgsConstructor
@Tag(name = "Cost Codes", description = "Cost code management endpoints")
public class CostCodeController {

    private final CostCodeService costCodeService;

    @GetMapping
    @Operation(summary = "List cost codes by project with pagination")
    public ResponseEntity<ApiResponse<PageResponse<CostCodeResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CostCodeResponse> page = costCodeService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/all")
    @Operation(summary = "List all cost codes by project (no pagination)")
    public ResponseEntity<ApiResponse<List<CostCodeResponse>>> listAll(@RequestParam UUID projectId) {
        List<CostCodeResponse> list = costCodeService.listAllByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get cost code by ID")
    public ResponseEntity<ApiResponse<CostCodeResponse>> getById(@PathVariable UUID id) {
        CostCodeResponse response = costCodeService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Get child cost codes")
    public ResponseEntity<ApiResponse<List<CostCodeResponse>>> getChildren(@PathVariable UUID id) {
        List<CostCodeResponse> children = costCodeService.getChildren(id);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Create a new cost code")
    public ResponseEntity<ApiResponse<CostCodeResponse>> create(
            @Valid @RequestBody CreateCostCodeRequest request) {
        CostCodeResponse response = costCodeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Update a cost code")
    public ResponseEntity<ApiResponse<CostCodeResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCostCodeRequest request) {
        CostCodeResponse response = costCodeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a cost code (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        costCodeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
