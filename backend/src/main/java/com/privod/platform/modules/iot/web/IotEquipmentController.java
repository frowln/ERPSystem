package com.privod.platform.modules.iot.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.iot.domain.GeofenceAlertType;
import com.privod.platform.modules.iot.service.IotService;
import com.privod.platform.modules.iot.web.dto.CreateGeofenceZoneRequest;
import com.privod.platform.modules.iot.web.dto.CreateIotDeviceRequest;
import com.privod.platform.modules.iot.web.dto.GeofenceAlertResponse;
import com.privod.platform.modules.iot.web.dto.GeofenceZoneResponse;
import com.privod.platform.modules.iot.web.dto.IngestTelemetryRequest;
import com.privod.platform.modules.iot.web.dto.IotDashboardResponse;
import com.privod.platform.modules.iot.web.dto.IotEquipmentDeviceResponse;
import com.privod.platform.modules.iot.web.dto.IotTelemetryPointResponse;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/iot/equipment")
@RequiredArgsConstructor
@Tag(name = "IoT Equipment Dashboard", description = "GPS tracking, telemetry, and geofence management for equipment")
public class IotEquipmentController {

    private final IotService iotService;

    // ---- Devices ----

    @GetMapping("/devices")
    @Operation(summary = "List IoT equipment devices with optional search")
    public ResponseEntity<ApiResponse<PageResponse<IotEquipmentDeviceResponse>>> listDevices(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IotEquipmentDeviceResponse> page = iotService.listDevices(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/devices/{id}")
    @Operation(summary = "Get equipment device by ID")
    public ResponseEntity<ApiResponse<IotEquipmentDeviceResponse>> getDevice(@PathVariable UUID id) {
        IotEquipmentDeviceResponse response = iotService.getDevice(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/devices")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Register a new IoT equipment device")
    public ResponseEntity<ApiResponse<IotEquipmentDeviceResponse>> createDevice(
            @Valid @RequestBody CreateIotDeviceRequest request) {
        IotEquipmentDeviceResponse response = iotService.createDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Update an IoT equipment device")
    public ResponseEntity<ApiResponse<IotEquipmentDeviceResponse>> updateDevice(
            @PathVariable UUID id,
            @Valid @RequestBody CreateIotDeviceRequest request) {
        IotEquipmentDeviceResponse response = iotService.updateDevice(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    @Operation(summary = "Soft-delete an IoT equipment device")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable UUID id) {
        iotService.deleteDevice(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Telemetry ----

    @PostMapping("/telemetry/ingest")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Batch ingest telemetry data from equipment devices")
    public ResponseEntity<ApiResponse<List<IotTelemetryPointResponse>>> ingestTelemetry(
            @Valid @RequestBody List<IngestTelemetryRequest> requests) {
        List<IotTelemetryPointResponse> responses = iotService.ingestTelemetry(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(responses));
    }

    @GetMapping("/devices/{id}/location")
    @Operation(summary = "Get current location of a device (latest telemetry)")
    public ResponseEntity<ApiResponse<IotTelemetryPointResponse>> getDeviceLocation(
            @PathVariable UUID id) {
        IotTelemetryPointResponse response = iotService.getDeviceCurrentLocation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/devices/{id}/telemetry")
    @Operation(summary = "Get telemetry history for a device with optional date range")
    public ResponseEntity<ApiResponse<PageResponse<IotTelemetryPointResponse>>> getDeviceTelemetry(
            @PathVariable UUID id,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @PageableDefault(size = 50, sort = "recordedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IotTelemetryPointResponse> page = iotService.getDeviceTelemetry(id, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Geofence Zones ----

    @GetMapping("/zones")
    @Operation(summary = "List geofence zones")
    public ResponseEntity<ApiResponse<PageResponse<GeofenceZoneResponse>>> listZones(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GeofenceZoneResponse> page = iotService.listZones(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/zones/{id}")
    @Operation(summary = "Get geofence zone by ID")
    public ResponseEntity<ApiResponse<GeofenceZoneResponse>> getZone(@PathVariable UUID id) {
        GeofenceZoneResponse response = iotService.getZone(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/zones")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Create a new geofence zone")
    public ResponseEntity<ApiResponse<GeofenceZoneResponse>> createZone(
            @Valid @RequestBody CreateGeofenceZoneRequest request) {
        GeofenceZoneResponse response = iotService.createZone(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/zones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Update a geofence zone")
    public ResponseEntity<ApiResponse<GeofenceZoneResponse>> updateZone(
            @PathVariable UUID id,
            @Valid @RequestBody CreateGeofenceZoneRequest request) {
        GeofenceZoneResponse response = iotService.updateZone(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/zones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    @Operation(summary = "Soft-delete a geofence zone")
    public ResponseEntity<ApiResponse<Void>> deleteZone(@PathVariable UUID id) {
        iotService.deleteZone(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Alerts ----

    @GetMapping("/alerts")
    @Operation(summary = "List geofence alerts with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<GeofenceAlertResponse>>> listAlerts(
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(required = false) GeofenceAlertType alertType,
            @RequestParam(required = false) Boolean unacknowledgedOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<GeofenceAlertResponse> page = iotService.listAlerts(deviceId, alertType,
                unacknowledgedOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/alerts/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER', 'MANAGER')")
    @Operation(summary = "Acknowledge a geofence alert")
    public ResponseEntity<ApiResponse<GeofenceAlertResponse>> acknowledgeAlert(
            @PathVariable UUID id) {
        GeofenceAlertResponse response = iotService.acknowledgeAlert(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Dashboard ----

    @GetMapping("/dashboard")
    @Operation(summary = "Get IoT equipment dashboard statistics")
    public ResponseEntity<ApiResponse<IotDashboardResponse>> getDashboard() {
        IotDashboardResponse response = iotService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
