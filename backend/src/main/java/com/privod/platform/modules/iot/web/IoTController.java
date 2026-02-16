package com.privod.platform.modules.iot.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.service.IoTDeviceService;
import com.privod.platform.modules.iot.web.dto.CreateDeviceRequest;
import com.privod.platform.modules.iot.web.dto.IngestSensorDataRequest;
import com.privod.platform.modules.iot.web.dto.IoTAlertResponse;
import com.privod.platform.modules.iot.web.dto.IoTDeviceResponse;
import com.privod.platform.modules.iot.web.dto.IoTSensorDataResponse;
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
import org.springframework.security.access.AccessDeniedException;
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
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/iot")
@RequiredArgsConstructor
@Tag(name = "IoT", description = "IoT sensors and device management endpoints")
@PreAuthorize("hasAnyRole('ADMIN','ENGINEER')")
public class IoTController {

    private final IoTDeviceService deviceService;

    // ---- Devices ----

    @GetMapping("/devices")
    @Operation(summary = "List IoT devices with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<IoTDeviceResponse>>> listDevices(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) DeviceStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IoTDeviceResponse> page = deviceService.findAllDevices(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/devices/{id}")
    @Operation(summary = "Get device by ID")
    public ResponseEntity<ApiResponse<IoTDeviceResponse>> getDevice(@PathVariable UUID id) {
        IoTDeviceResponse response = deviceService.findDeviceById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/devices")
    @Operation(summary = "Register a new IoT device")
    public ResponseEntity<ApiResponse<IoTDeviceResponse>> createDevice(
            @Valid @RequestBody CreateDeviceRequest request) {
        IoTDeviceResponse response = deviceService.createDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/devices/{id}")
    @Operation(summary = "Update an IoT device")
    public ResponseEntity<ApiResponse<IoTDeviceResponse>> updateDevice(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDeviceRequest request) {
        IoTDeviceResponse response = deviceService.updateDevice(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/devices/{id}")
    @Operation(summary = "Decommission an IoT device (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable UUID id) {
        deviceService.deleteDevice(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Sensor Data ----

    @PostMapping("/data")
    @Operation(summary = "Ingest sensor data from a device")
    public ResponseEntity<ApiResponse<IoTSensorDataResponse>> ingestData(
            @Valid @RequestBody IngestSensorDataRequest request) {
        IoTSensorDataResponse response = deviceService.ingestData(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/devices/{deviceId}/data")
    @Operation(summary = "Get sensor data for a device")
    public ResponseEntity<ApiResponse<PageResponse<IoTSensorDataResponse>>> getSensorData(
            @PathVariable UUID deviceId,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IoTSensorDataResponse> page = deviceService.findSensorData(deviceId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ---- Alerts ----

    @GetMapping("/alerts")
    @Operation(summary = "List IoT alerts with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<IoTAlertResponse>>> listAlerts(
            @RequestParam(required = false) UUID deviceId,
            @RequestParam(required = false) AlertStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IoTAlertResponse> page = deviceService.findAlerts(deviceId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/alerts/{id}/acknowledge")
    @Operation(summary = "Acknowledge an alert")
    public ResponseEntity<ApiResponse<IoTAlertResponse>> acknowledgeAlert(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot acknowledge alert on behalf of another user");
        }
        IoTAlertResponse response = deviceService.acknowledgeAlert(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/alerts/{id}/resolve")
    @Operation(summary = "Resolve an alert")
    public ResponseEntity<ApiResponse<IoTAlertResponse>> resolveAlert(@PathVariable UUID id) {
        IoTAlertResponse response = deviceService.resolveAlert(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
