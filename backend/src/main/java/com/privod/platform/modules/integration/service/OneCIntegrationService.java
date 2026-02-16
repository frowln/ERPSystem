package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.OneCExchangeLog;
import com.privod.platform.modules.integration.domain.OneCExchangeStatus;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;
import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.domain.SyncType;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.repository.OneCExchangeLogRepository;
import com.privod.platform.modules.integration.repository.OneCMappingRepository;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateOneCConfigRequest;
import com.privod.platform.modules.integration.web.dto.OneCConfigResponse;
import com.privod.platform.modules.integration.web.dto.OneCEntitySyncRequest;
import com.privod.platform.modules.integration.web.dto.OneCExchangeLogResponse;
import com.privod.platform.modules.integration.web.dto.OneCMappingResponse;
import com.privod.platform.modules.integration.web.dto.StartSyncRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OneCIntegrationService {

    private final SyncService syncService;
    private final IntegrationEndpointService endpointService;
    private final OneCConfigRepository configRepository;
    private final OneCExchangeLogRepository exchangeLogRepository;
    private final OneCMappingRepository mappingRepository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;

    // === Config CRUD ===

    @Transactional(readOnly = true)
    public Page<OneCConfigResponse> listConfigs(Pageable pageable) {
        return configRepository.findByDeletedFalse(pageable)
                .map(OneCConfigResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OneCConfigResponse getConfig(UUID id) {
        OneCConfig config = getConfigOrThrow(id);
        return OneCConfigResponse.fromEntity(config);
    }

    @Transactional
    public OneCConfigResponse createConfig(CreateOneCConfigRequest request) {
        if (configRepository.existsByNameAndDeletedFalse(request.name())) {
            throw new IllegalStateException("Конфигурация 1С с названием '" + request.name() + "' уже существует");
        }

        OneCConfig config = OneCConfig.builder()
                .name(request.name())
                .baseUrl(request.baseUrl())
                .username(request.username())
                .password(request.password())
                .databaseName(request.databaseName())
                .syncDirection(request.syncDirection())
                .syncIntervalMinutes(request.syncIntervalMinutes())
                .isActive(true)
                .build();

        config = configRepository.save(config);
        auditService.logCreate("OneCConfig", config.getId());

        log.info("Конфигурация 1С создана: {} ({})", config.getName(), config.getId());
        return OneCConfigResponse.fromEntity(config);
    }

    @Transactional
    public OneCConfigResponse updateConfig(UUID id, CreateOneCConfigRequest request) {
        OneCConfig config = getConfigOrThrow(id);

        config.setName(request.name());
        config.setBaseUrl(request.baseUrl());
        config.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            config.setPassword(request.password());
        }
        config.setDatabaseName(request.databaseName());
        config.setSyncDirection(request.syncDirection());
        config.setSyncIntervalMinutes(request.syncIntervalMinutes());

        config = configRepository.save(config);
        auditService.logUpdate("OneCConfig", config.getId(), "config", null, null);

        log.info("Конфигурация 1С обновлена: {} ({})", config.getName(), config.getId());
        return OneCConfigResponse.fromEntity(config);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        OneCConfig config = getConfigOrThrow(id);
        config.softDelete();
        configRepository.save(config);
        auditService.logDelete("OneCConfig", id);
        log.info("Конфигурация 1С удалена: {} ({})", config.getName(), id);
    }

    @Transactional
    public OneCConfigResponse toggleActive(UUID id) {
        OneCConfig config = getConfigOrThrow(id);
        boolean oldActive = config.isActive();
        config.setActive(!oldActive);
        config = configRepository.save(config);
        auditService.logUpdate("OneCConfig", id, "isActive",
                String.valueOf(oldActive), String.valueOf(config.isActive()));

        log.info("Конфигурация 1С {}: {} ({})",
                config.isActive() ? "активирована" : "деактивирована", config.getName(), id);
        return OneCConfigResponse.fromEntity(config);
    }

    // === Exchange Log ===

    @Transactional(readOnly = true)
    public Page<OneCExchangeLogResponse> listExchangeLogs(UUID configId, Pageable pageable) {
        if (configId != null) {
            return exchangeLogRepository.findByConfigIdAndDeletedFalse(configId, pageable)
                    .map(OneCExchangeLogResponse::fromEntity);
        }
        return exchangeLogRepository.findByDeletedFalse(pageable)
                .map(OneCExchangeLogResponse::fromEntity);
    }

    @Transactional
    public OneCExchangeLogResponse startExchange(UUID configId, OneCExchangeType exchangeType,
                                                   SyncDirection direction) {
        OneCConfig config = getConfigOrThrow(configId);

        OneCExchangeLog exchangeLog = OneCExchangeLog.builder()
                .configId(configId)
                .exchangeType(exchangeType)
                .direction(direction != null ? direction : config.getSyncDirection())
                .status(OneCExchangeStatus.STARTED)
                .startedAt(Instant.now())
                .build();

        exchangeLog = exchangeLogRepository.save(exchangeLog);
        auditService.logCreate("OneCExchangeLog", exchangeLog.getId());

        log.info("Обмен 1С запущен: конфигурация {} ({}), тип {}, направление {}",
                config.getName(), configId, exchangeType.getDisplayName(),
                exchangeLog.getDirection().getDisplayName());
        return OneCExchangeLogResponse.fromEntity(exchangeLog);
    }

    @Transactional
    public OneCExchangeLogResponse completeExchange(UUID exchangeLogId, int recordsProcessed,
                                                      int recordsFailed, String errorMessage) {
        OneCExchangeLog exchangeLog = getExchangeLogOrThrow(exchangeLogId);

        OneCExchangeStatus newStatus = recordsFailed > 0 && recordsProcessed == 0
                ? OneCExchangeStatus.FAILED
                : OneCExchangeStatus.COMPLETED;

        exchangeLog.setStatus(newStatus);
        exchangeLog.setCompletedAt(Instant.now());
        exchangeLog.setRecordsProcessed(recordsProcessed);
        exchangeLog.setRecordsFailed(recordsFailed);
        exchangeLog.setErrorMessage(errorMessage);

        exchangeLog = exchangeLogRepository.save(exchangeLog);

        // Update config last sync time
        OneCConfig config = getConfigOrThrow(exchangeLog.getConfigId());
        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        log.info("Обмен 1С завершён: {} ({}), обработано {}, ошибок {}",
                newStatus.getDisplayName(), exchangeLogId, recordsProcessed, recordsFailed);
        return OneCExchangeLogResponse.fromEntity(exchangeLog);
    }

    // === Mapping CRUD ===

    @Transactional(readOnly = true)
    public Page<OneCMappingResponse> listMappings(String entityType, Pageable pageable) {
        if (entityType != null) {
            return mappingRepository.findByEntityTypeAndDeletedFalse(entityType, pageable)
                    .map(OneCMappingResponse::fromEntity);
        }
        return mappingRepository.findByDeletedFalse(pageable)
                .map(OneCMappingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OneCMappingResponse getMappingByPrivodId(UUID privodId, String entityType) {
        OneCMapping mapping = mappingRepository.findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, entityType)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Маппинг 1С не найден для privodId=" + privodId + ", entityType=" + entityType));
        return OneCMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public OneCMappingResponse createMapping(String entityType, UUID privodId, String oneCId, String oneCCode) {
        mappingRepository.findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, entityType)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Маппинг для " + entityType + " с privodId=" + privodId + " уже существует");
                });

        OneCMapping mapping = OneCMapping.builder()
                .entityType(entityType)
                .privodId(privodId)
                .oneCId(oneCId)
                .oneCCode(oneCCode)
                .syncStatus(OneCMappingSyncStatus.SYNCED)
                .lastSyncAt(Instant.now())
                .build();

        mapping = mappingRepository.save(mapping);
        auditService.logCreate("OneCMapping", mapping.getId());

        log.info("Маппинг 1С создан: {} privodId={} -> oneCId={}", entityType, privodId, oneCId);
        return OneCMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public OneCMappingResponse updateMappingStatus(UUID id, OneCMappingSyncStatus status, String conflictData) {
        OneCMapping mapping = getMappingOrThrow(id);
        OneCMappingSyncStatus oldStatus = mapping.getSyncStatus();

        mapping.setSyncStatus(status);
        mapping.setLastSyncAt(Instant.now());
        if (conflictData != null) {
            mapping.setConflictData(conflictData);
        }

        mapping = mappingRepository.save(mapping);
        auditService.logStatusChange("OneCMapping", id, oldStatus.name(), status.name());

        log.info("Статус маппинга 1С обновлён: {} -> {} ({})", oldStatus, status, id);
        return OneCMappingResponse.fromEntity(mapping);
    }

    // === Test Connection & Status ===

    @Transactional
    public ConnectionTestResponse testConnection(UUID configId) {
        OneCConfig config = getConfigOrThrow(configId);
        long startTime = System.currentTimeMillis();

        try {
            // Build OData metadata URL for 1C
            String metadataUrl = buildODataUrl(config, "$metadata");

            HttpHeaders headers = new HttpHeaders();
            String auth = config.getUsername() + ":" + config.getPassword();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encodedAuth);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        metadataUrl, HttpMethod.GET, request, String.class);

                long responseTime = System.currentTimeMillis() - startTime;

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Тест соединения 1С успешен для конфигурации {} ({})", config.getName(), configId);
                    return new ConnectionTestResponse(
                            true, HealthStatus.HEALTHY, HealthStatus.HEALTHY.getDisplayName(),
                            "Соединение с 1С установлено успешно. База: " + config.getDatabaseName(),
                            responseTime, Instant.now());
                } else {
                    return new ConnectionTestResponse(
                            false, HealthStatus.DEGRADED, HealthStatus.DEGRADED.getDisplayName(),
                            "1С вернул статус: " + response.getStatusCode(),
                            responseTime, Instant.now());
                }
            } catch (RestClientException e) {
                long responseTime = System.currentTimeMillis() - startTime;
                String msg = e.getMessage();
                // 401/403 means the server is reachable
                if (msg != null && (msg.contains("401") || msg.contains("403"))) {
                    log.info("1С доступен, но требуется корректная авторизация: {}", config.getName());
                    return new ConnectionTestResponse(
                            true, HealthStatus.DEGRADED, HealthStatus.DEGRADED.getDisplayName(),
                            "Сервер 1С доступен. Проверьте логин и пароль.",
                            responseTime, Instant.now());
                }
                throw e;
            }
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("Ошибка теста соединения 1С для {} ({}): {}", config.getName(), configId, e.getMessage());
            return new ConnectionTestResponse(
                    false, HealthStatus.DOWN, HealthStatus.DOWN.getDisplayName(),
                    "Ошибка соединения с 1С: " + e.getMessage(),
                    responseTime, Instant.now());
        }
    }

    @Transactional(readOnly = true)
    public OneCConfigResponse getActiveConfigStatus() {
        OneCConfig config = configRepository.findAll().stream()
                .filter(c -> !c.isDeleted() && c.isActive())
                .findFirst()
                .orElse(null);

        if (config == null) {
            return null;
        }
        return OneCConfigResponse.fromEntity(config);
    }

    private String buildODataUrl(OneCConfig config, String path) {
        String baseUrl = config.getBaseUrl().endsWith("/")
                ? config.getBaseUrl()
                : config.getBaseUrl() + "/";
        return baseUrl + config.getDatabaseName() + "/odata/standard.odata/" + path;
    }

    // === Sync operations (delegate to SyncService) ===

    @Transactional
    public SyncJobResponse syncInvoices(OneCEntitySyncRequest request) {
        log.info("Синхронизация счетов 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "invoice",
                request.syncType() != null ? request.syncType() : SyncType.INCREMENTAL);
    }

    @Transactional
    public SyncJobResponse syncPayments(OneCEntitySyncRequest request) {
        log.info("Синхронизация платежей 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "payment",
                request.syncType() != null ? request.syncType() : SyncType.INCREMENTAL);
    }

    @Transactional
    public SyncJobResponse syncEmployees(OneCEntitySyncRequest request) {
        log.info("Синхронизация сотрудников 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "employee",
                request.syncType() != null ? request.syncType() : SyncType.FULL);
    }

    @Transactional
    public SyncJobResponse syncMaterials(OneCEntitySyncRequest request) {
        log.info("Синхронизация материалов 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "material",
                request.syncType() != null ? request.syncType() : SyncType.INCREMENTAL);
    }

    @Transactional
    public SyncJobResponse importContractors(OneCEntitySyncRequest request) {
        log.info("Импорт контрагентов из 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "contractor", SyncType.FULL, SyncDirection.IMPORT);
    }

    @Transactional
    public SyncJobResponse exportDocuments(OneCEntitySyncRequest request) {
        log.info("Экспорт документов в 1С для endpoint: {}", request.endpointId());
        return startOneCSync(request.endpointId(), "document", SyncType.INCREMENTAL, SyncDirection.EXPORT);
    }

    // === Private helpers ===

    private SyncJobResponse startOneCSync(UUID endpointId, String entityType, SyncType syncType) {
        return startOneCSync(endpointId, entityType, syncType, SyncDirection.BIDIRECTIONAL);
    }

    private SyncJobResponse startOneCSync(UUID endpointId, String entityType, SyncType syncType, SyncDirection direction) {
        endpointService.getEndpointOrThrow(endpointId);

        StartSyncRequest syncRequest = new StartSyncRequest(
                endpointId, syncType, direction, entityType
        );

        return syncService.startSync(syncRequest);
    }

    private OneCConfig getConfigOrThrow(UUID id) {
        return configRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация 1С не найдена: " + id));
    }

    private OneCExchangeLog getExchangeLogOrThrow(UUID id) {
        return exchangeLogRepository.findById(id)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Лог обмена 1С не найден: " + id));
    }

    private OneCMapping getMappingOrThrow(UUID id) {
        return mappingRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маппинг 1С не найден: " + id));
    }
}
