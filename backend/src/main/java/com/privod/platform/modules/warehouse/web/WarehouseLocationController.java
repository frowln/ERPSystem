package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;
import com.privod.platform.modules.warehouse.service.WarehouseLocationService;
import com.privod.platform.modules.warehouse.web.dto.CreateWarehouseLocationRequest;
import com.privod.platform.modules.warehouse.web.dto.UpdateWarehouseLocationRequest;
import com.privod.platform.modules.warehouse.web.dto.WarehouseLocationResponse;
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

@RestController
@RequestMapping("/api/warehouse/locations")
@RequiredArgsConstructor
@Tag(name = "Warehouse Locations", description = "Warehouse location management endpoints")
public class WarehouseLocationController {

    private final WarehouseLocationService locationService;

    @GetMapping
    @Operation(summary = "List warehouse locations with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<WarehouseLocationResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WarehouseLocationType locationType,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<WarehouseLocationResponse> page = locationService.listLocations(search, locationType, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse location by ID")
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> getById(@PathVariable UUID id) {
        WarehouseLocationResponse response = locationService.getLocation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Get child locations for a parent location")
    public ResponseEntity<ApiResponse<List<WarehouseLocationResponse>>> getChildren(@PathVariable UUID id) {
        List<WarehouseLocationResponse> children = locationService.getChildren(id);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Create a new warehouse location")
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> create(
            @Valid @RequestBody CreateWarehouseLocationRequest request) {
        WarehouseLocationResponse response = locationService.createLocation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Update an existing warehouse location")
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseLocationRequest request) {
        WarehouseLocationResponse response = locationService.updateLocation(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Delete a warehouse location (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
