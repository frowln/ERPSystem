package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.service.FuelService;
import com.privod.platform.modules.fleet.web.dto.CreateFuelRecordRequest;
import com.privod.platform.modules.fleet.web.dto.FuelConsumptionReportResponse;
import com.privod.platform.modules.fleet.web.dto.FuelRecordResponse;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/fuel")
@RequiredArgsConstructor
@Tag(name = "Fleet - Fuel", description = "Fuel record management endpoints")
public class FuelController {

    private final FuelService fuelService;

    @GetMapping
    @Operation(summary = "List fuel records with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<FuelRecordResponse>>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<FuelRecordResponse> page = fuelService.listFuelRecords(vehicleId, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get fuel record by ID")
    public ResponseEntity<ApiResponse<FuelRecordResponse>> getById(@PathVariable UUID id) {
        FuelRecordResponse response = fuelService.getFuelRecord(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER', 'OPERATOR')")
    @Operation(summary = "Create a new fuel record")
    public ResponseEntity<ApiResponse<FuelRecordResponse>> create(
            @Valid @RequestBody CreateFuelRecordRequest request) {
        FuelRecordResponse response = fuelService.createFuelRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER', 'OPERATOR')")
    @Operation(summary = "Update a fuel record")
    public ResponseEntity<ApiResponse<FuelRecordResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateFuelRecordRequest request) {
        FuelRecordResponse response = fuelService.updateFuelRecord(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Soft-delete a fuel record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        fuelService.deleteFuelRecord(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/history/{vehicleId}")
    @Operation(summary = "Get fuel history for a vehicle")
    public ResponseEntity<ApiResponse<List<FuelRecordResponse>>> getVehicleFuelHistory(
            @PathVariable UUID vehicleId) {
        List<FuelRecordResponse> records = fuelService.getVehicleFuelHistory(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/costs/by-project/{projectId}")
    @Operation(summary = "Get total fuel costs for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getFuelCostsByProject(
            @PathVariable UUID projectId) {
        BigDecimal totalCost = fuelService.getFuelCostsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(totalCost));
    }

    @GetMapping("/consumption-report/{vehicleId}")
    @Operation(summary = "Get fuel consumption report for a vehicle within a date range")
    public ResponseEntity<ApiResponse<FuelConsumptionReportResponse>> getConsumptionReport(
            @PathVariable UUID vehicleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        FuelConsumptionReportResponse report = fuelService.getFuelConsumptionReport(vehicleId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}
