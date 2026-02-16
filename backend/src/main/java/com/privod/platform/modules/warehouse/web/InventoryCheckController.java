package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.InventoryCheckStatus;
import com.privod.platform.modules.warehouse.service.InventoryCheckService;
import com.privod.platform.modules.warehouse.web.dto.CreateInventoryCheckRequest;
import com.privod.platform.modules.warehouse.web.dto.InventoryCheckLineResponse;
import com.privod.platform.modules.warehouse.web.dto.InventoryCheckResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateInventoryCheckLineRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/inventory-checks")
@RequiredArgsConstructor
@Tag(name = "Inventory Checks", description = "Inventory check (stocktaking) management endpoints")
public class InventoryCheckController {

    private final InventoryCheckService checkService;

    @GetMapping
    @Operation(summary = "List inventory checks with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<InventoryCheckResponse>>> list(
            @RequestParam(required = false) InventoryCheckStatus status,
            @RequestParam(required = false) UUID locationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<InventoryCheckResponse> page = checkService.listChecks(status, locationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inventory check by ID with lines")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> getById(@PathVariable UUID id) {
        InventoryCheckResponse response = checkService.getCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/lines")
    @Operation(summary = "Get inventory check lines")
    public ResponseEntity<ApiResponse<List<InventoryCheckLineResponse>>> getLines(@PathVariable UUID id) {
        List<InventoryCheckLineResponse> lines = checkService.getCheckLines(id);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Create a new inventory check")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> create(
            @Valid @RequestBody CreateInventoryCheckRequest request) {
        InventoryCheckResponse response = checkService.createCheck(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Start inventory check - populate expected quantities from stock")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> start(@PathVariable UUID id) {
        InventoryCheckResponse response = checkService.startCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{checkId}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Update inventory check line with actual quantity")
    public ResponseEntity<ApiResponse<InventoryCheckLineResponse>> updateLine(
            @PathVariable UUID checkId,
            @Valid @RequestBody UpdateInventoryCheckLineRequest request) {
        InventoryCheckLineResponse response = checkService.updateCheckLine(checkId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Complete inventory check - create adjustment movements for variances")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> complete(@PathVariable UUID id) {
        InventoryCheckResponse response = checkService.completeCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Cancel an inventory check")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> cancel(@PathVariable UUID id) {
        InventoryCheckResponse response = checkService.cancelCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
