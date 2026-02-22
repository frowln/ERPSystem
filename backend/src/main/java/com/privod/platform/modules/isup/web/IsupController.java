package com.privod.platform.modules.isup.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.isup.domain.IsupTransmissionStatus;
import com.privod.platform.modules.isup.domain.IsupTransmissionType;
import com.privod.platform.modules.isup.service.IsupIntegrationService;
import com.privod.platform.modules.isup.web.dto.CreateIsupConfigRequest;
import com.privod.platform.modules.isup.web.dto.CreateProjectMappingRequest;
import com.privod.platform.modules.isup.web.dto.IsupConfigurationResponse;
import com.privod.platform.modules.isup.web.dto.IsupDashboardResponse;
import com.privod.platform.modules.isup.web.dto.IsupProjectMappingResponse;
import com.privod.platform.modules.isup.web.dto.IsupTransmissionResponse;
import com.privod.platform.modules.isup.web.dto.IsupVerificationRecordResponse;
import com.privod.platform.modules.isup.web.dto.ReceiveVerificationRequest;
import com.privod.platform.modules.isup.web.dto.TriggerTransmissionRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/isup")
@RequiredArgsConstructor
@Tag(name = "ISUP Вертикаль", description = "Интеграция с ИСУП «Вертикаль»")
public class IsupController {

    private final IsupIntegrationService isupService;

    // ==================== Configuration ====================

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список конфигураций ИСУП")
    public ResponseEntity<ApiResponse<PageResponse<IsupConfigurationResponse>>> listConfigs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IsupConfigurationResponse> page = isupService.listConfigs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/config/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить конфигурацию ИСУП по ID")
    public ResponseEntity<ApiResponse<IsupConfigurationResponse>> getConfig(@PathVariable UUID id) {
        IsupConfigurationResponse response = isupService.getConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать конфигурацию ИСУП")
    public ResponseEntity<ApiResponse<IsupConfigurationResponse>> createConfig(
            @Valid @RequestBody CreateIsupConfigRequest request) {
        IsupConfigurationResponse response = isupService.createConfig(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/config/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию ИСУП")
    public ResponseEntity<ApiResponse<IsupConfigurationResponse>> updateConfig(
            @PathVariable UUID id, @Valid @RequestBody CreateIsupConfigRequest request) {
        IsupConfigurationResponse response = isupService.updateConfig(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/config/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить конфигурацию ИСУП")
    public ResponseEntity<ApiResponse<Void>> deleteConfig(@PathVariable UUID id) {
        isupService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/config/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Переключить активность конфигурации ИСУП")
    public ResponseEntity<ApiResponse<IsupConfigurationResponse>> toggleConfig(@PathVariable UUID id) {
        IsupConfigurationResponse response = isupService.toggleConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ==================== Project Mappings ====================

    @GetMapping("/mappings")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список маппингов проектов ИСУП")
    public ResponseEntity<ApiResponse<PageResponse<IsupProjectMappingResponse>>> listMappings(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IsupProjectMappingResponse> page = isupService.listMappings(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/mappings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить маппинг проекта ИСУП по ID")
    public ResponseEntity<ApiResponse<IsupProjectMappingResponse>> getMapping(@PathVariable UUID id) {
        IsupProjectMappingResponse response = isupService.getMapping(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/mappings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать маппинг проекта ИСУП")
    public ResponseEntity<ApiResponse<IsupProjectMappingResponse>> createMapping(
            @Valid @RequestBody CreateProjectMappingRequest request) {
        IsupProjectMappingResponse response = isupService.createMapping(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить маппинг проекта ИСУП")
    public ResponseEntity<ApiResponse<IsupProjectMappingResponse>> updateMapping(
            @PathVariable UUID id, @Valid @RequestBody CreateProjectMappingRequest request) {
        IsupProjectMappingResponse response = isupService.updateMapping(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить маппинг проекта ИСУП")
    public ResponseEntity<ApiResponse<Void>> deleteMapping(@PathVariable UUID id) {
        isupService.deleteMapping(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/mappings/{id}/toggle-sync")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Переключить синхронизацию маппинга ИСУП")
    public ResponseEntity<ApiResponse<IsupProjectMappingResponse>> toggleMappingSync(@PathVariable UUID id) {
        IsupProjectMappingResponse response = isupService.toggleMappingSync(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ==================== Transmissions ====================

    @PostMapping("/transmit/progress/{mappingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Передать ход строительства в ИСУП")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> transmitProgress(
            @PathVariable UUID mappingId) {
        IsupTransmissionResponse response = isupService.transmitProgress(mappingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/transmit/documents/{mappingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Передать документацию в ИСУП")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> transmitDocuments(
            @PathVariable UUID mappingId,
            @RequestBody(required = false) TriggerTransmissionRequest request) {
        IsupTransmissionResponse response = isupService.transmitDocuments(
                mappingId, request != null ? request.documentIds() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/transmit/photos/{mappingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Передать фотоматериалы в ИСУП")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> transmitPhotos(
            @PathVariable UUID mappingId) {
        IsupTransmissionResponse response = isupService.transmitPhotos(mappingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/transmissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список передач ИСУП")
    public ResponseEntity<ApiResponse<PageResponse<IsupTransmissionResponse>>> listTransmissions(
            @RequestParam(required = false) IsupTransmissionStatus status,
            @RequestParam(required = false) IsupTransmissionType type,
            @RequestParam(required = false) UUID projectMappingId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IsupTransmissionResponse> page = isupService.listTransmissions(
                status, type, projectMappingId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/transmissions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить передачу ИСУП по ID")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> getTransmission(@PathVariable UUID id) {
        IsupTransmissionResponse response = isupService.getTransmission(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/transmissions/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обработать и отправить передачу в ИСУП")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> processTransmission(@PathVariable UUID id) {
        IsupTransmissionResponse response = isupService.processTransmission(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/transmissions/{id}/retry")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Повторить отправку передачи ИСУП")
    public ResponseEntity<ApiResponse<IsupTransmissionResponse>> retryTransmission(@PathVariable UUID id) {
        IsupTransmissionResponse response = isupService.retryTransmission(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ==================== Verifications ====================

    @PostMapping("/verifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить верификацию от ИСУП")
    public ResponseEntity<ApiResponse<IsupVerificationRecordResponse>> receiveVerification(
            @Valid @RequestBody ReceiveVerificationRequest request) {
        IsupVerificationRecordResponse response = isupService.receiveVerification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/verifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список верификаций ИСУП")
    public ResponseEntity<ApiResponse<PageResponse<IsupVerificationRecordResponse>>> listVerifications(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<IsupVerificationRecordResponse> page = isupService.listVerifications(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Дашборд интеграции ИСУП")
    public ResponseEntity<ApiResponse<IsupDashboardResponse>> getDashboard() {
        IsupDashboardResponse response = isupService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
