package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.service.SbisService;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateSbisConfigRequest;
import com.privod.platform.modules.integration.web.dto.CreateSbisDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SbisConfigResponse;
import com.privod.platform.modules.integration.web.dto.SbisDocumentResponse;
import com.privod.platform.modules.integration.web.dto.SbisPartnerMappingResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/sbis")
@RequiredArgsConstructor
@Tag(name = "SBIS Integration", description = "Интеграция с СБИС")
public class SbisController {

    private final SbisService sbisService;

    // === Config endpoints ===

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список конфигураций СБИС")
    public ResponseEntity<ApiResponse<PageResponse<SbisConfigResponse>>> listConfigs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SbisConfigResponse> page = sbisService.listConfigs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить конфигурацию СБИС по ID")
    public ResponseEntity<ApiResponse<SbisConfigResponse>> getConfig(@PathVariable UUID id) {
        SbisConfigResponse response = sbisService.getConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать конфигурацию СБИС")
    public ResponseEntity<ApiResponse<SbisConfigResponse>> createConfig(
            @Valid @RequestBody CreateSbisConfigRequest request) {
        SbisConfigResponse response = sbisService.createConfig(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию СБИС")
    public ResponseEntity<ApiResponse<SbisConfigResponse>> updateConfig(
            @PathVariable UUID id, @Valid @RequestBody CreateSbisConfigRequest request) {
        SbisConfigResponse response = sbisService.updateConfig(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить конфигурацию СБИС")
    public ResponseEntity<ApiResponse<Void>> deleteConfig(@PathVariable UUID id) {
        sbisService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/configs/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Переключить активность конфигурации СБИС")
    public ResponseEntity<ApiResponse<SbisConfigResponse>> toggleConfig(@PathVariable UUID id) {
        SbisConfigResponse response = sbisService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/configs/{id}/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Тестировать соединение с СБИС")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(@PathVariable UUID id) {
        ConnectionTestResponse response = sbisService.testConnection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Синхронизация документов с СБИС")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> syncDocuments() {
        sbisService.syncDocuments();
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // === Document endpoints ===

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER')")
    @Operation(summary = "Список документов СБИС")
    public ResponseEntity<ApiResponse<PageResponse<SbisDocumentResponse>>> listDocuments(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SbisDocumentResponse> page = sbisService.listDocuments(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER')")
    @Operation(summary = "Получить документ СБИС по ID")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> getDocument(@PathVariable UUID id) {
        SbisDocumentResponse response = sbisService.getDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Создать документ СБИС")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> createDocument(
            @Valid @RequestBody CreateSbisDocumentRequest request) {
        SbisDocumentResponse response = sbisService.createDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/documents/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Отправить документ СБИС")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> sendDocument(@PathVariable UUID id) {
        SbisDocumentResponse response = sbisService.sendDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/documents/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Принять документ СБИС")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> acceptDocument(@PathVariable UUID id) {
        SbisDocumentResponse response = sbisService.acceptDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/documents/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Отклонить документ СБИС")
    public ResponseEntity<ApiResponse<SbisDocumentResponse>> rejectDocument(
            @PathVariable UUID id, @RequestBody(required = false) String reason) {
        SbisDocumentResponse response = sbisService.rejectDocument(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Удалить документ СБИС")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        sbisService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // === Partner mapping endpoints ===

    @GetMapping("/partner-mappings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Список маппингов контрагентов СБИС")
    public ResponseEntity<ApiResponse<PageResponse<SbisPartnerMappingResponse>>> listPartnerMappings(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SbisPartnerMappingResponse> page = sbisService.listPartnerMappings(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @DeleteMapping("/partner-mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить маппинг контрагента СБИС")
    public ResponseEntity<ApiResponse<Void>> deletePartnerMapping(@PathVariable UUID id) {
        sbisService.deletePartnerMapping(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
