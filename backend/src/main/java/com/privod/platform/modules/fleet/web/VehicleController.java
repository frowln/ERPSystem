package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.service.VehicleService;
import com.privod.platform.modules.fleet.web.dto.AssignVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.CreateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.UpdateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.VehicleAssignmentResponse;
import com.privod.platform.modules.fleet.web.dto.VehicleResponse;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/vehicles")
@RequiredArgsConstructor
@Tag(name = "Fleet - Vehicles", description = "Vehicle management endpoints")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @Operation(summary = "List vehicles with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<VehicleResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) VehicleType vehicleType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<VehicleResponse> page = vehicleService.listVehicles(search, status, vehicleType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle by ID")
    public ResponseEntity<ApiResponse<VehicleResponse>> getById(@PathVariable UUID id) {
        VehicleResponse response = vehicleService.getVehicle(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> create(
            @Valid @RequestBody CreateVehicleRequest request) {
        VehicleResponse response = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleRequest request) {
        VehicleResponse response = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Soft-delete a vehicle")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Assign vehicle to a project")
    public ResponseEntity<ApiResponse<VehicleAssignmentResponse>> assignToProject(
            @PathVariable UUID id,
            @Valid @RequestBody AssignVehicleRequest request) {
        VehicleAssignmentResponse response = vehicleService.assignToProject(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Return vehicle from project")
    public ResponseEntity<ApiResponse<VehicleAssignmentResponse>> returnFromProject(
            @PathVariable UUID id) {
        VehicleAssignmentResponse response = vehicleService.returnFromProject(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/available")
    @Operation(summary = "Get all available vehicles")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAvailable() {
        List<VehicleResponse> vehicles = vehicleService.getAvailableVehicles();
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }

    @GetMapping("/by-project/{projectId}")
    @Operation(summary = "Get vehicles assigned to a project")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getByProject(
            @PathVariable UUID projectId) {
        List<VehicleResponse> vehicles = vehicleService.getVehiclesByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }

    @GetMapping("/expiring-insurance")
    @Operation(summary = "Get vehicles with expiring insurance")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getExpiringInsurance(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<VehicleResponse> vehicles = vehicleService.getExpiringInsurance(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }

    @GetMapping("/expiring-tech-inspection")
    @Operation(summary = "Get vehicles with expiring technical inspection")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getExpiringTechInspection(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<VehicleResponse> vehicles = vehicleService.getExpiringTechInspection(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }

    @GetMapping("/{id}/depreciation")
    @Operation(summary = "Calculate and get vehicle depreciation")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateDepreciation(@PathVariable UUID id) {
        BigDecimal currentValue = vehicleService.calculateDepreciation(id);
        return ResponseEntity.ok(ApiResponse.ok(currentValue));
    }

    @GetMapping("/{id}/assignments")
    @Operation(summary = "Get assignment history for a vehicle")
    public ResponseEntity<ApiResponse<PageResponse<VehicleAssignmentResponse>>> getAssignments(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<VehicleAssignmentResponse> page = vehicleService.getVehicleAssignments(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
