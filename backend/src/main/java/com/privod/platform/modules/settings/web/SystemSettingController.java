package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.service.SystemSettingService;
import com.privod.platform.modules.settings.web.dto.SystemSettingResponse;
import com.privod.platform.modules.settings.web.dto.UpdateSystemSettingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Settings", description = "Управление системными настройками")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    @Operation(summary = "Получить все системные настройки")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAll() {
        List<SystemSettingResponse> settings = systemSettingService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Получить настройки по категории")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getByCategory(
            @PathVariable SettingCategory category) {
        List<SystemSettingResponse> settings = systemSettingService.getByCategory(category);
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/key/{key}")
    @Operation(summary = "Получить настройку по ключу")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getByKey(@PathVariable String key) {
        SystemSettingResponse setting = systemSettingService.getByKey(key);
        return ResponseEntity.ok(ApiResponse.ok(setting));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить настройку по ID")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getById(@PathVariable UUID id) {
        SystemSettingResponse setting = systemSettingService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(setting));
    }

    @PutMapping("/key/{key}")
    @Operation(summary = "Обновить значение настройки")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> update(
            @PathVariable String key,
            @Valid @RequestBody UpdateSystemSettingRequest request) {
        SystemSettingResponse setting = systemSettingService.updateSetting(key, request);
        return ResponseEntity.ok(ApiResponse.ok(setting));
    }
}
