package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.service.OneCDataExchangeService;
import com.privod.platform.modules.integration.service.OneCIntegrationService;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateOneCConfigRequest;
import com.privod.platform.modules.integration.web.dto.OneCConfigResponse;
import com.privod.platform.modules.integration.web.dto.OneCEntitySyncRequest;
import com.privod.platform.modules.integration.web.dto.OneCExchangeLogResponse;
import com.privod.platform.modules.integration.web.dto.OneCMappingResponse;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/1c")
@RequiredArgsConstructor
@Tag(name = "1C Integration", description = "Интеграция с 1С")
public class OneCController {

    private final OneCIntegrationService oneCIntegrationService;
    private final OneCDataExchangeService dataExchangeService;

    // === Config endpoints ===

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список конфигураций 1С")
    public ResponseEntity<ApiResponse<PageResponse<OneCConfigResponse>>> listConfigs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OneCConfigResponse> page = oneCIntegrationService.listConfigs(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить конфигурацию 1С по ID")
    public ResponseEntity<ApiResponse<OneCConfigResponse>> getConfig(@PathVariable UUID id) {
        OneCConfigResponse response = oneCIntegrationService.getConfig(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать конфигурацию 1С")
    public ResponseEntity<ApiResponse<OneCConfigResponse>> createConfig(
            @Valid @RequestBody CreateOneCConfigRequest request) {
        OneCConfigResponse response = oneCIntegrationService.createConfig(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию 1С")
    public ResponseEntity<ApiResponse<OneCConfigResponse>> updateConfig(
            @PathVariable UUID id, @Valid @RequestBody CreateOneCConfigRequest request) {
        OneCConfigResponse response = oneCIntegrationService.updateConfig(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить конфигурацию 1С")
    public ResponseEntity<ApiResponse<Void>> deleteConfig(@PathVariable UUID id) {
        oneCIntegrationService.deleteConfig(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/configs/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Переключить активность конфигурации 1С")
    public ResponseEntity<ApiResponse<OneCConfigResponse>> toggleConfig(@PathVariable UUID id) {
        OneCConfigResponse response = oneCIntegrationService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/configs/{id}/test-connection")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Тестировать соединение с 1С")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(@PathVariable UUID id) {
        ConnectionTestResponse response = oneCIntegrationService.testConnection(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/configs/{id}/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Запустить синхронизацию с 1С")
    public ResponseEntity<ApiResponse<OneCExchangeLogResponse>> triggerSync(
            @PathVariable UUID id,
            @RequestParam(required = false) OneCExchangeType exchangeType,
            @RequestParam(required = false) SyncDirection direction) {
        OneCExchangeLogResponse response = oneCIntegrationService.startExchange(id,
                exchangeType != null ? exchangeType : OneCExchangeType.FULL,
                direction);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Статус интеграции с 1С")
    public ResponseEntity<ApiResponse<OneCConfigResponse>> getStatus() {
        OneCConfigResponse response = oneCIntegrationService.getActiveConfigStatus();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // === Exchange log endpoints ===

    @GetMapping("/exchange-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Журнал обменов с 1С")
    public ResponseEntity<ApiResponse<PageResponse<OneCExchangeLogResponse>>> listExchangeLogs(
            @RequestParam(required = false) UUID configId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OneCExchangeLogResponse> page = oneCIntegrationService.listExchangeLogs(configId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // === Mapping endpoints ===

    @GetMapping("/mappings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Список маппингов 1С")
    public ResponseEntity<ApiResponse<PageResponse<OneCMappingResponse>>> listMappings(
            @RequestParam(required = false) String entityType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OneCMappingResponse> page = oneCIntegrationService.listMappings(entityType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // === Sync operations ===

    @PostMapping("/invoices/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Синхронизация счетов с 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> syncInvoices(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.syncInvoices(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/payments/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Синхронизация платежей с 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> syncPayments(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.syncPayments(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/employees/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @Operation(summary = "Синхронизация сотрудников с 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> syncEmployees(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.syncEmployees(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/materials/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Синхронизация материалов с 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> syncMaterials(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.syncMaterials(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/contractors/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Импорт контрагентов из 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> importContractors(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.importContractors(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/documents/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Экспорт документов в 1С")
    public ResponseEntity<ApiResponse<SyncJobResponse>> exportDocuments(
            @Valid @RequestBody OneCEntitySyncRequest request) {
        SyncJobResponse response = oneCIntegrationService.exportDocuments(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    // === Real OData Data Exchange endpoints ===

    @PostMapping("/configs/{id}/full-exchange")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Полный обмен данными с 1С (OData)")
    public ResponseEntity<ApiResponse<Map<String, OneCDataExchangeService.ExchangeResult>>> fullExchange(
            @PathVariable UUID id) {
        Map<String, OneCDataExchangeService.ExchangeResult> results = dataExchangeService.fullSync(id);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @PostMapping("/configs/{id}/import/{entityType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Импорт сущности из 1С (OData)")
    public ResponseEntity<ApiResponse<OneCDataExchangeService.ExchangeResult>> importEntity(
            @PathVariable UUID id, @PathVariable String entityType) {
        OneCDataExchangeService.ExchangeResult result = switch (entityType) {
            case "counterparty" -> dataExchangeService.importCounterparties(id);
            case "material" -> dataExchangeService.importMaterials(id);
            case "employee" -> dataExchangeService.importEmployees(id);
            case "invoice" -> dataExchangeService.importInvoices(id);
            case "payment" -> dataExchangeService.importPayments(id);
            default -> throw new IllegalArgumentException("Неизвестный тип сущности: " + entityType);
        };
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/configs/{id}/export/{entityType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Экспорт сущности в 1С (OData)")
    public ResponseEntity<ApiResponse<OneCDataExchangeService.ExchangeResult>> exportEntity(
            @PathVariable UUID id,
            @PathVariable String entityType,
            @RequestParam UUID privodId,
            @RequestBody Map<String, Object> data) {
        OneCDataExchangeService.ExchangeResult result = dataExchangeService.exportEntity(
                id, entityType, privodId, data);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/configs/{id}/incremental/{entityType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Инкрементальная синхронизация с 1С (OData)")
    public ResponseEntity<ApiResponse<OneCDataExchangeService.ExchangeResult>> incrementalSync(
            @PathVariable UUID id, @PathVariable String entityType) {
        OneCDataExchangeService.ExchangeResult result = dataExchangeService.incrementalSync(id, entityType);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
