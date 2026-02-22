package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.StockAlertSeverity;
import com.privod.platform.modules.warehouse.service.StockLimitService;
import com.privod.platform.modules.warehouse.web.dto.CreateStockLimitRequest;
import com.privod.platform.modules.warehouse.web.dto.StockLimitAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.StockLimitResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockLimitRequest;
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
@RequestMapping("/api/warehouse/stock-limits")
@RequiredArgsConstructor
@Tag(name = "Stock Limits", description = "Stock limits and stock limit alerts")
@PreAuthorize("hasAnyRole('ADMIN','WAREHOUSE_MANAGER','PROCUREMENT_MANAGER')")
public class StockLimitController {

    private final StockLimitService stockLimitService;

    @GetMapping
    @Operation(summary = "List stock limits")
    public ResponseEntity<ApiResponse<PageResponse<StockLimitResponse>>> listLimits(
            @RequestParam(required = false) UUID materialId,
            @RequestParam(required = false) UUID warehouseLocationId,
            @RequestParam(required = false) UUID locationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        UUID resolvedLocationId = warehouseLocationId != null ? warehouseLocationId : locationId;
        Page<StockLimitResponse> page = stockLimitService.listLimits(materialId, resolvedLocationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock limit by ID")
    public ResponseEntity<ApiResponse<StockLimitResponse>> getLimit(@PathVariable UUID id) {
        StockLimitResponse response = stockLimitService.getLimit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create stock limit")
    public ResponseEntity<ApiResponse<StockLimitResponse>> createLimit(
            @Valid @RequestBody CreateStockLimitRequest request) {
        StockLimitResponse response = stockLimitService.createLimit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update stock limit")
    public ResponseEntity<ApiResponse<StockLimitResponse>> updateLimit(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStockLimitRequest request) {
        StockLimitResponse response = stockLimitService.updateLimit(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete stock limit")
    public ResponseEntity<ApiResponse<Void>> deleteLimit(@PathVariable UUID id) {
        stockLimitService.deleteLimit(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/alerts")
    @Operation(summary = "List stock limit alerts")
    public ResponseEntity<ApiResponse<PageResponse<StockLimitAlertResponse>>> listAlerts(
            @RequestParam(required = false) StockAlertSeverity severity,
            @RequestParam(required = false) Boolean resolved,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StockLimitAlertResponse> page = stockLimitService.listAlerts(severity, resolved, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/alerts/{id}/acknowledge")
    @Operation(summary = "Acknowledge stock limit alert")
    public ResponseEntity<ApiResponse<StockLimitAlertResponse>> acknowledgeAlert(@PathVariable UUID id) {
        StockLimitAlertResponse response = stockLimitService.acknowledgeAlert(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/alerts/{id}/resolve")
    @Operation(summary = "Resolve stock limit alert")
    public ResponseEntity<ApiResponse<StockLimitAlertResponse>> resolveAlert(@PathVariable UUID id) {
        StockLimitAlertResponse response = stockLimitService.resolveAlert(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
