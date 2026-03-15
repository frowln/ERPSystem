package com.privod.platform.modules.settings.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.settings.service.CustomFieldService;
import com.privod.platform.modules.settings.web.dto.CreateCustomFieldRequest;
import com.privod.platform.modules.settings.web.dto.CustomFieldDefinitionResponse;
import com.privod.platform.modules.settings.web.dto.CustomFieldValueRequest;
import com.privod.platform.modules.settings.web.dto.CustomFieldValueResponse;
import com.privod.platform.modules.settings.web.dto.UpdateCustomFieldRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/custom-fields")
@RequiredArgsConstructor
@Tag(name = "Custom Fields", description = "Управление пользовательскими полями")
public class CustomFieldController {

    private final CustomFieldService customFieldService;

    // ─── Definitions (ADMIN only) ───────────────────────────────────

    @GetMapping("/definitions")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Список определений пользовательских полей по типу сущности")
    public ResponseEntity<ApiResponse<List<CustomFieldDefinitionResponse>>> getDefinitions(
            @RequestParam String entityType) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<CustomFieldDefinitionResponse> definitions = customFieldService.getDefinitions(orgId, entityType);
        return ResponseEntity.ok(ApiResponse.ok(definitions));
    }

    @GetMapping("/definitions/all")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Все определения пользовательских полей организации")
    public ResponseEntity<ApiResponse<Map<String, List<CustomFieldDefinitionResponse>>>> getAllDefinitions() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Map<String, List<CustomFieldDefinitionResponse>> grouped = customFieldService.getAllDefinitions(orgId);
        return ResponseEntity.ok(ApiResponse.ok(grouped));
    }

    @PostMapping("/definitions")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Создать определение пользовательского поля")
    public ResponseEntity<ApiResponse<CustomFieldDefinitionResponse>> createDefinition(
            @Valid @RequestBody CreateCustomFieldRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        CustomFieldDefinitionResponse response = customFieldService.createDefinition(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/definitions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Обновить определение пользовательского поля")
    public ResponseEntity<ApiResponse<CustomFieldDefinitionResponse>> updateDefinition(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomFieldRequest request) {
        CustomFieldDefinitionResponse response = customFieldService.updateDefinition(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/definitions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Удалить определение пользовательского поля")
    public ResponseEntity<ApiResponse<Void>> deleteDefinition(@PathVariable UUID id) {
        customFieldService.deleteDefinition(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Values (authenticated users) ───────────────────────────────

    @GetMapping("/values/{entityType}/{entityId}")
    @Operation(summary = "Получить значения пользовательских полей для сущности")
    public ResponseEntity<ApiResponse<List<CustomFieldValueResponse>>> getValues(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        List<CustomFieldValueResponse> values = customFieldService.getValues(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok(values));
    }

    @PutMapping("/values/{entityType}/{entityId}")
    @Operation(summary = "Сохранить значения пользовательских полей для сущности")
    public ResponseEntity<ApiResponse<List<CustomFieldValueResponse>>> saveValues(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @Valid @RequestBody List<CustomFieldValueRequest> requests) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<CustomFieldValueResponse> saved = customFieldService.saveValues(orgId, entityType, entityId, requests);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }
}
