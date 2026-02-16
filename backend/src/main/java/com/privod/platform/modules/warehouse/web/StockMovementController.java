package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.StockMovementStatus;
import com.privod.platform.modules.warehouse.domain.StockMovementType;
import com.privod.platform.modules.warehouse.service.StockMovementService;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementLineRequest;
import com.privod.platform.modules.warehouse.web.dto.CreateStockMovementRequest;
import com.privod.platform.modules.warehouse.web.dto.StockMovementLineResponse;
import com.privod.platform.modules.warehouse.web.dto.StockMovementResponse;
import com.privod.platform.modules.warehouse.web.dto.UpdateStockMovementRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse/movements")
@RequiredArgsConstructor
@Tag(name = "Stock Movements", description = "Stock movement management endpoints")
public class StockMovementController {

    private final StockMovementService movementService;

    @GetMapping
    @Operation(summary = "List stock movements with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> list(
            @RequestParam(required = false) StockMovementStatus status,
            @RequestParam(required = false) StockMovementType movementType,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StockMovementResponse> page = movementService.listMovements(status, movementType, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock movement by ID with lines")
    public ResponseEntity<ApiResponse<StockMovementResponse>> getById(@PathVariable UUID id) {
        StockMovementResponse response = movementService.getMovement(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/lines")
    @Operation(summary = "Get stock movement lines")
    public ResponseEntity<ApiResponse<List<StockMovementLineResponse>>> getLines(@PathVariable UUID id) {
        List<StockMovementLineResponse> lines = movementService.getMovementLines(id);
        return ResponseEntity.ok(ApiResponse.ok(lines));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Create a new stock movement")
    public ResponseEntity<ApiResponse<StockMovementResponse>> create(
            @Valid @RequestBody CreateStockMovementRequest request) {
        StockMovementResponse response = movementService.createMovement(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Update a stock movement in DRAFT status")
    public ResponseEntity<ApiResponse<StockMovementResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStockMovementRequest request) {
        StockMovementResponse response = movementService.updateMovement(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Add a line to a stock movement")
    public ResponseEntity<ApiResponse<StockMovementLineResponse>> addLine(
            @PathVariable UUID id,
            @Valid @RequestBody CreateStockMovementLineRequest request) {
        StockMovementLineResponse response = movementService.addLine(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Confirm a stock movement - validate quantities")
    public ResponseEntity<ApiResponse<StockMovementResponse>> confirm(@PathVariable UUID id) {
        StockMovementResponse response = movementService.confirmMovement(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Execute a confirmed stock movement - update stock entries")
    public ResponseEntity<ApiResponse<StockMovementResponse>> execute(@PathVariable UUID id) {
        StockMovementResponse response = movementService.executeMovement(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Cancel a stock movement - reverse if already executed")
    public ResponseEntity<ApiResponse<StockMovementResponse>> cancel(@PathVariable UUID id) {
        StockMovementResponse response = movementService.cancelMovement(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Delete a stock movement in DRAFT status")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        movementService.deleteMovement(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/history")
    @Operation(summary = "Get movement history by location and date range")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> getHistory(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @PageableDefault(size = 20, sort = "movementDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<StockMovementResponse> page = movementService.getMovementHistory(locationId, dateFrom, dateTo, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/receipt-from-purchase")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Create a receipt movement from a purchase request")
    public ResponseEntity<ApiResponse<StockMovementResponse>> createReceiptFromPurchase(
            @RequestParam UUID purchaseRequestId,
            @RequestParam UUID destinationLocationId,
            @RequestParam(required = false) UUID responsibleId,
            @RequestParam(required = false) String responsibleName) {
        StockMovementResponse response = movementService.createReceiptFromPurchase(
                purchaseRequestId, destinationLocationId, responsibleId, responsibleName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
