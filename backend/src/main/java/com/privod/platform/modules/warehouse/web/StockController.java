package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.service.StockService;
import com.privod.platform.modules.warehouse.web.dto.LowStockAlertResponse;
import com.privod.platform.modules.warehouse.web.dto.MaterialAvailabilityResponse;
import com.privod.platform.modules.warehouse.web.dto.StockEntryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/warehouse/stock")
@RequiredArgsConstructor
@Tag(name = "Stock", description = "Stock/inventory query endpoints")
@PreAuthorize("hasAnyRole('ADMIN','WAREHOUSE_MANAGER','PROCUREMENT_MANAGER')")
public class StockController {

    private final StockService stockService;

    @GetMapping
    @Operation(summary = "List all stock entries with pagination")
    public ResponseEntity<ApiResponse<PageResponse<StockEntryResponse>>> listAll(
            @PageableDefault(size = 20, sort = "materialName", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<StockEntryResponse> page = stockService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/location/{locationId}")
    @Operation(summary = "Get stock entries by warehouse location")
    public ResponseEntity<ApiResponse<PageResponse<StockEntryResponse>>> getStockByLocation(
            @PathVariable UUID locationId,
            @PageableDefault(size = 20, sort = "materialName", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<StockEntryResponse> page = stockService.getStockByLocation(locationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/material/{materialId}")
    @Operation(summary = "Get stock entries by material across all locations")
    public ResponseEntity<ApiResponse<PageResponse<StockEntryResponse>>> getStockByMaterial(
            @PathVariable UUID materialId,
            @PageableDefault(size = 20, sort = "quantity", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StockEntryResponse> page = stockService.getStockByMaterial(materialId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/material/{materialId}/availability")
    @Operation(summary = "Get material availability summary across all locations")
    public ResponseEntity<ApiResponse<MaterialAvailabilityResponse>> getMaterialAvailability(
            @PathVariable UUID materialId) {

        MaterialAvailabilityResponse response = stockService.getMaterialAvailability(materialId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/alerts/low-stock")
    @Operation(summary = "Get low stock alerts - materials below minimum stock level")
    public ResponseEntity<ApiResponse<List<LowStockAlertResponse>>> getLowStockAlerts() {
        List<LowStockAlertResponse> alerts = stockService.getLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get stock at project site locations")
    public ResponseEntity<ApiResponse<PageResponse<StockEntryResponse>>> getProjectStock(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "materialName", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<StockEntryResponse> page = stockService.getProjectStock(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
