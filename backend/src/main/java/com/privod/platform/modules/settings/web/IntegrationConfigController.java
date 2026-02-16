package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.service.IntegrationConfigService;
import com.privod.platform.modules.settings.web.dto.CreateIntegrationConfigRequest;
import com.privod.platform.modules.settings.web.dto.IntegrationConfigResponse;
import com.privod.platform.modules.settings.web.dto.UpdateIntegrationConfigRequest;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/integrations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Integration Configs", description = "Управление интеграциями")
public class IntegrationConfigController {

    private final IntegrationConfigService integrationConfigService;

    @GetMapping
    @Operation(summary = "Список всех интеграций")
    public ResponseEntity<ApiResponse<List<IntegrationConfigResponse>>> listAll() {
        List<IntegrationConfigResponse> configs = integrationConfigService.listAll();
        return ResponseEntity.ok(ApiResponse.ok(configs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить интеграцию по ID")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> getById(@PathVariable UUID id) {
        IntegrationConfigResponse response = integrationConfigService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Получить интеграцию по коду")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> getByCode(@PathVariable String code) {
        IntegrationConfigResponse response = integrationConfigService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Создать новую интеграцию")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> create(
            @Valid @RequestBody CreateIntegrationConfigRequest request) {
        IntegrationConfigResponse response = integrationConfigService.createConfig(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить интеграцию")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIntegrationConfigRequest request) {
        IntegrationConfigResponse response = integrationConfigService.updateConfig(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить интеграцию")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        integrationConfigService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/code/{code}/test")
    @Operation(summary = "Проверить подключение интеграции")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection(@PathVariable String code) {
        Map<String, Object> result = integrationConfigService.testConnection(code);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/code/{code}/sync")
    @Operation(summary = "Запустить синхронизацию")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> startSync(@PathVariable String code) {
        IntegrationConfigResponse response = integrationConfigService.startSync(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/code/{code}/status")
    @Operation(summary = "Получить статус интеграции")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(@PathVariable String code) {
        Map<String, Object> status = integrationConfigService.getStatus(code);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }
}
