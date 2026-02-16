package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import com.privod.platform.modules.integration.service.IntegrationEndpointService;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateIntegrationEndpointRequest;
import com.privod.platform.modules.integration.web.dto.IntegrationEndpointResponse;
import com.privod.platform.modules.integration.web.dto.UpdateIntegrationEndpointRequest;
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
@RequestMapping("/api/admin/integrations/endpoints")
@RequiredArgsConstructor
@Tag(name = "Integration Endpoints", description = "Управление точками интеграции")
public class IntegrationController {

    private final IntegrationEndpointService endpointService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список всех точек интеграции")
    public ResponseEntity<ApiResponse<PageResponse<IntegrationEndpointResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IntegrationEndpointResponse> page = endpointService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить точку интеграции по ID")
    public ResponseEntity<ApiResponse<IntegrationEndpointResponse>> getById(@PathVariable UUID id) {
        IntegrationEndpointResponse response = endpointService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-provider")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить точки интеграции по провайдеру")
    public ResponseEntity<ApiResponse<List<IntegrationEndpointResponse>>> getByProvider(
            @RequestParam IntegrationProvider provider) {
        List<IntegrationEndpointResponse> responses = endpointService.findByProvider(provider);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать точку интеграции")
    public ResponseEntity<ApiResponse<IntegrationEndpointResponse>> create(
            @Valid @RequestBody CreateIntegrationEndpointRequest request) {
        IntegrationEndpointResponse response = endpointService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить точку интеграции")
    public ResponseEntity<ApiResponse<IntegrationEndpointResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIntegrationEndpointRequest request) {
        IntegrationEndpointResponse response = endpointService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить точку интеграции")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        endpointService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Тестировать соединение с точкой интеграции")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(@PathVariable UUID id) {
        ConnectionTestResponse response = endpointService.testConnection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Проверить состояние точки интеграции")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> healthCheck(@PathVariable UUID id) {
        ConnectionTestResponse response = endpointService.healthCheck(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
