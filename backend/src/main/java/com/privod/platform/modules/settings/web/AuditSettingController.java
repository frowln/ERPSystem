package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.service.AuditSettingService;
import com.privod.platform.modules.settings.web.dto.AuditSettingResponse;
import com.privod.platform.modules.settings.web.dto.CreateAuditSettingRequest;
import com.privod.platform.modules.settings.web.dto.UpdateAuditSettingRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit-settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Settings", description = "Управление настройками аудита")
public class AuditSettingController {

    private final AuditSettingService auditSettingService;

    @GetMapping
    @Operation(summary = "Список всех настроек аудита")
    public ResponseEntity<ApiResponse<List<AuditSettingResponse>>> listAll() {
        List<AuditSettingResponse> settings = auditSettingService.listAll();
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить настройку аудита по ID")
    public ResponseEntity<ApiResponse<AuditSettingResponse>> getById(@PathVariable UUID id) {
        AuditSettingResponse response = auditSettingService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/model/{modelName}")
    @Operation(summary = "Получить настройку аудита по названию модели")
    public ResponseEntity<ApiResponse<AuditSettingResponse>> getByModelName(@PathVariable String modelName) {
        AuditSettingResponse response = auditSettingService.getByModelName(modelName);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Создать настройку аудита")
    public ResponseEntity<ApiResponse<AuditSettingResponse>> create(
            @Valid @RequestBody CreateAuditSettingRequest request) {
        AuditSettingResponse response = auditSettingService.createSetting(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить настройку аудита")
    public ResponseEntity<ApiResponse<AuditSettingResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAuditSettingRequest request) {
        AuditSettingResponse response = auditSettingService.updateSetting(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить настройку аудита")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        auditSettingService.deleteSetting(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
