package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.domain.WaybillStatus;
import com.privod.platform.modules.fleet.service.FleetWaybillService;
import com.privod.platform.modules.fleet.web.dto.CreateFleetWaybillRequest;
import com.privod.platform.modules.fleet.web.dto.FleetWaybillResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateFleetWaybillRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/waybills")
@RequiredArgsConstructor
@Tag(name = "Fleet Waybills", description = "Vehicle trip waybills (путевые листы) per Prikaz Mintransa 390")
public class FleetWaybillController {

    private final FleetWaybillService waybillService;

    @GetMapping
    @Operation(summary = "List waybills with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<FleetWaybillResponse>>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) WaybillStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "waybillDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FleetWaybillResponse> page = waybillService.listWaybills(vehicleId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get waybill by ID")
    public ResponseEntity<ApiResponse<FleetWaybillResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(waybillService.getWaybill(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Create a new waybill")
    public ResponseEntity<ApiResponse<FleetWaybillResponse>> create(
            @Valid @RequestBody CreateFleetWaybillRequest request) {
        FleetWaybillResponse response = waybillService.createWaybill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Update a waybill")
    public ResponseEntity<ApiResponse<FleetWaybillResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFleetWaybillRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(waybillService.updateWaybill(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Change waybill status")
    public ResponseEntity<ApiResponse<FleetWaybillResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam WaybillStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(waybillService.changeStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Delete a waybill (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        waybillService.deleteWaybill(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
