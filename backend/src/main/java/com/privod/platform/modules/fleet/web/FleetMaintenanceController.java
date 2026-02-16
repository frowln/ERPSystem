package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.domain.MaintenanceStatus;
import com.privod.platform.modules.fleet.service.FleetMaintenanceService;
import com.privod.platform.modules.fleet.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.fleet.web.dto.MaintenanceCostResponse;
import com.privod.platform.modules.fleet.web.dto.MaintenanceRecordResponse;
import com.privod.platform.modules.fleet.web.dto.UpdateMaintenanceRequest;
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
@RequestMapping("/api/fleet/maintenance")
@RequiredArgsConstructor
@Tag(name = "Fleet - Maintenance", description = "Vehicle maintenance management endpoints")
public class FleetMaintenanceController {

    private final FleetMaintenanceService maintenanceService;

    @GetMapping
    @Operation(summary = "List maintenance records with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceRecordResponse>>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) MaintenanceStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<MaintenanceRecordResponse> page = maintenanceService.listMaintenance(vehicleId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get maintenance record by ID")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> getById(@PathVariable UUID id) {
        MaintenanceRecordResponse response = maintenanceService.getMaintenance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Schedule a new maintenance record")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> schedule(
            @Valid @RequestBody CreateMaintenanceRequest request) {
        MaintenanceRecordResponse response = maintenanceService.schedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a maintenance record")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMaintenanceRequest request) {
        MaintenanceRecordResponse response = maintenanceService.updateMaintenance(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Start maintenance work")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> start(@PathVariable UUID id) {
        MaintenanceRecordResponse response = maintenanceService.startMaintenance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Complete maintenance work")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> complete(@PathVariable UUID id) {
        MaintenanceRecordResponse response = maintenanceService.completeMaintenance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Cancel maintenance work")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> cancel(@PathVariable UUID id) {
        MaintenanceRecordResponse response = maintenanceService.cancelMaintenance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Delete a maintenance record (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming maintenance records")
    public ResponseEntity<ApiResponse<List<MaintenanceRecordResponse>>> getUpcoming(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<MaintenanceRecordResponse> records = maintenanceService.getUpcomingMaintenance(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/history/{vehicleId}")
    @Operation(summary = "Get maintenance history for a vehicle")
    public ResponseEntity<ApiResponse<List<MaintenanceRecordResponse>>> getHistory(
            @PathVariable UUID vehicleId) {
        List<MaintenanceRecordResponse> records = maintenanceService.getMaintenanceHistory(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/costs/{vehicleId}")
    @Operation(summary = "Get total maintenance costs for a vehicle")
    public ResponseEntity<ApiResponse<MaintenanceCostResponse>> getCosts(
            @PathVariable UUID vehicleId) {
        MaintenanceCostResponse response = maintenanceService.getMaintenanceCosts(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
