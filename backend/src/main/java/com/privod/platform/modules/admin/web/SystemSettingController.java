package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.admin.service.SystemSettingService;
import com.privod.platform.modules.admin.web.dto.CreateSettingRequest;
import com.privod.platform.modules.admin.web.dto.SystemSettingResponse;
import com.privod.platform.modules.admin.web.dto.UpdateSettingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController("adminSystemSettingController")
@RequestMapping("/api/admin/system-settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Settings", description = "System configuration management")
public class SystemSettingController {
    private final SystemSettingService settingService;

    @GetMapping
    @Operation(summary = "Get all settings")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.ok(settingService.getAllSettings()));
    }

    @GetMapping("/grouped")
    @Operation(summary = "Get settings grouped by category")
    public ResponseEntity<ApiResponse<Map<String, List<SystemSettingResponse>>>> getGrouped() {
        return ResponseEntity.ok(ApiResponse.ok(settingService.getSettingsGrouped()));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get settings by category")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.ok(settingService.getSettingsByCategory(category)));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update a setting")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody UpdateSettingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(settingService.updateSetting(key, request)));
    }

    @PostMapping
    @Operation(summary = "Create a new setting")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> createSetting(
            @Valid @RequestBody CreateSettingRequest request) {
        SystemSettingResponse response = settingService.createSetting(
                request.key(), request.value(), request.type(), request.category(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
