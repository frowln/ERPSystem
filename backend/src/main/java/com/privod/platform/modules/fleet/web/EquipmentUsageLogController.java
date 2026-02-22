package com.privod.platform.modules.fleet.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.fleet.service.EquipmentUsageLogService;
import com.privod.platform.modules.fleet.service.MachineHourCalculatorService;
import com.privod.platform.modules.fleet.web.dto.CreateEquipmentUsageLogRequest;
import com.privod.platform.modules.fleet.web.dto.EquipmentUsageLogResponse;
import com.privod.platform.modules.fleet.web.dto.MachineHourRateResponse;
import com.privod.platform.modules.fleet.web.dto.OwnVsRentResponse;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/fleet/usage-logs")
@RequiredArgsConstructor
@Tag(name = "Fleet - Equipment Usage Logs", description = "Engine hours tracking & machine-hour calculator")
public class EquipmentUsageLogController {

    private final EquipmentUsageLogService usageLogService;
    private final MachineHourCalculatorService machineHourCalculatorService;

    @GetMapping
    @Operation(summary = "List equipment usage logs with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<EquipmentUsageLogResponse>>> list(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "usageDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<EquipmentUsageLogResponse> page = usageLogService.list(vehicleId, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment usage log by ID")
    public ResponseEntity<ApiResponse<EquipmentUsageLogResponse>> getById(@PathVariable UUID id) {
        EquipmentUsageLogResponse response = usageLogService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN', 'OPERATOR')")
    @Operation(summary = "Create a new equipment usage log entry")
    public ResponseEntity<ApiResponse<EquipmentUsageLogResponse>> create(
            @Valid @RequestBody CreateEquipmentUsageLogRequest request) {
        EquipmentUsageLogResponse response = usageLogService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Update an equipment usage log entry")
    public ResponseEntity<ApiResponse<EquipmentUsageLogResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEquipmentUsageLogRequest request) {
        EquipmentUsageLogResponse response = usageLogService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    @Operation(summary = "Soft-delete an equipment usage log entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        usageLogService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/total-hours/{vehicleId}")
    @Operation(summary = "Get total hours logged for a vehicle")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalHours(@PathVariable UUID vehicleId) {
        BigDecimal totalHours = usageLogService.getTotalHoursForVehicle(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok(totalHours));
    }

    @GetMapping("/machine-hour-rate/{vehicleId}")
    @Operation(summary = "Calculate machine-hour rate for a vehicle per МДС 81-3.2001")
    public ResponseEntity<ApiResponse<MachineHourRateResponse>> calculateMachineHourRate(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) BigDecimal fuelPricePerLiter) {
        MachineHourRateResponse response = machineHourCalculatorService.calculateRate(vehicleId, fuelPricePerLiter);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/own-vs-rent/{vehicleId}")
    @Operation(summary = "Compare own vs rent costs for a vehicle")
    public ResponseEntity<ApiResponse<OwnVsRentResponse>> compareOwnVsRent(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) BigDecimal fuelPricePerLiter) {
        OwnVsRentResponse response = machineHourCalculatorService.compareOwnVsRent(vehicleId, fuelPricePerLiter);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
