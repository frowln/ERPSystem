package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;
import com.privod.platform.modules.accounting.service.FixedAssetService;
import com.privod.platform.modules.accounting.web.dto.CreateFixedAssetRequest;
import com.privod.platform.modules.accounting.web.dto.FixedAssetResponse;
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
@RequestMapping("/api/fixed-assets")
@RequiredArgsConstructor
@Tag(name = "Fixed Assets", description = "Fixed asset management (Основные средства)")
public class FixedAssetController {

    private final FixedAssetService fixedAssetService;

    @GetMapping
    @Operation(summary = "List fixed assets")
    public ResponseEntity<ApiResponse<PageResponse<FixedAssetResponse>>> list(
            @RequestParam(required = false) FixedAssetStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<FixedAssetResponse> page = fixedAssetService.listAssets(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get fixed asset by ID")
    public ResponseEntity<ApiResponse<FixedAssetResponse>> getById(@PathVariable UUID id) {
        FixedAssetResponse response = fixedAssetService.getAsset(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new fixed asset")
    public ResponseEntity<ApiResponse<FixedAssetResponse>> create(
            @Valid @RequestBody CreateFixedAssetRequest request) {
        FixedAssetResponse response = fixedAssetService.createAsset(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Put fixed asset into service")
    public ResponseEntity<ApiResponse<FixedAssetResponse>> activate(@PathVariable UUID id) {
        FixedAssetResponse response = fixedAssetService.activateAsset(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/dispose")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Dispose a fixed asset")
    public ResponseEntity<ApiResponse<FixedAssetResponse>> dispose(@PathVariable UUID id) {
        FixedAssetResponse response = fixedAssetService.disposeAsset(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a fixed asset")
    public ResponseEntity<ApiResponse<FixedAssetResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateFixedAssetRequest request) {
        FixedAssetResponse response = fixedAssetService.updateAsset(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Delete a fixed asset (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        fixedAssetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }
}
