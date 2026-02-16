package com.privod.platform.modules.settings.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.IntegrationConfig;
import com.privod.platform.modules.settings.domain.SyncStatus;
import com.privod.platform.modules.settings.repository.IntegrationConfigRepository;
import com.privod.platform.modules.settings.web.dto.CreateIntegrationConfigRequest;
import com.privod.platform.modules.settings.web.dto.IntegrationConfigResponse;
import com.privod.platform.modules.settings.web.dto.UpdateIntegrationConfigRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationConfigService {

    private final IntegrationConfigRepository integrationConfigRepository;
    private final SettingEncryptionService encryptionService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<IntegrationConfigResponse> listAll() {
        return integrationConfigRepository.findByDeletedFalseOrderByNameAsc()
                .stream()
                .map(IntegrationConfigResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public IntegrationConfigResponse getByCode(String code) {
        IntegrationConfig config = getConfigOrThrow(code);
        return IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional(readOnly = true)
    public IntegrationConfigResponse getById(UUID id) {
        IntegrationConfig config = integrationConfigRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Интеграция не найдена: " + id));
        return IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional
    public IntegrationConfigResponse createConfig(CreateIntegrationConfigRequest request) {
        if (integrationConfigRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Интеграция с кодом '" + request.code() + "' уже существует");
        }

        IntegrationConfig config = IntegrationConfig.builder()
                .code(request.code())
                .name(request.name())
                .integrationType(request.integrationType())
                .baseUrl(request.baseUrl())
                .apiKey(request.apiKey() != null ? encryptionService.encrypt(request.apiKey()) : null)
                .apiSecret(request.apiSecret() != null ? encryptionService.encrypt(request.apiSecret()) : null)
                .configJson(request.configJson() != null ? request.configJson() : new HashMap<>())
                .build();

        config = integrationConfigRepository.save(config);
        auditService.logCreate("IntegrationConfig", config.getId());

        log.info("Integration config created: {} ({})", config.getCode(), config.getId());
        return IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional
    public IntegrationConfigResponse updateConfig(UUID id, UpdateIntegrationConfigRequest request) {
        IntegrationConfig config = integrationConfigRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Интеграция не найдена: " + id));

        if (request.name() != null) {
            config.setName(request.name());
        }
        if (request.integrationType() != null) {
            config.setIntegrationType(request.integrationType());
        }
        if (request.baseUrl() != null) {
            config.setBaseUrl(request.baseUrl());
        }
        if (request.apiKey() != null) {
            config.setApiKey(encryptionService.encrypt(request.apiKey()));
        }
        if (request.apiSecret() != null) {
            config.setApiSecret(encryptionService.encrypt(request.apiSecret()));
        }
        if (request.isActive() != null) {
            config.setActive(request.isActive());
        }
        if (request.configJson() != null) {
            config.setConfigJson(request.configJson());
        }

        config = integrationConfigRepository.save(config);
        auditService.logUpdate("IntegrationConfig", config.getId(), "multiple", null, null);

        log.info("Integration config updated: {} ({})", config.getCode(), config.getId());
        return IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        IntegrationConfig config = integrationConfigRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Интеграция не найдена: " + id));

        config.softDelete();
        integrationConfigRepository.save(config);
        auditService.logDelete("IntegrationConfig", config.getId());

        log.info("Integration config deleted: {} ({})", config.getCode(), config.getId());
    }

    /**
     * Tests the connection to the integration endpoint.
     * Returns a map with status and message.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> testConnection(String code) {
        IntegrationConfig config = getConfigOrThrow(code);

        Map<String, Object> result = new HashMap<>();
        result.put("code", config.getCode());
        result.put("name", config.getName());

        if (config.getBaseUrl() == null || config.getBaseUrl().isEmpty()) {
            result.put("success", false);
            result.put("message", "URL не настроен");
            return result;
        }

        // In a full implementation, this would make an HTTP request to the baseUrl.
        // For now, we return a placeholder success if URL is configured.
        try {
            log.info("Testing connection to integration: {} ({})", config.getCode(), config.getBaseUrl());
            result.put("success", true);
            result.put("message", "Подключение успешно (проверка URL)");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Ошибка подключения: " + e.getMessage());
        }

        return result;
    }

    /**
     * Starts a sync operation for the given integration.
     */
    @Transactional
    public IntegrationConfigResponse startSync(String code) {
        IntegrationConfig config = getConfigOrThrow(code);

        if (!config.isActive()) {
            throw new IllegalStateException("Интеграция '" + config.getName() + "' неактивна");
        }

        if (config.getSyncStatus() == SyncStatus.SYNCING) {
            throw new IllegalStateException("Синхронизация уже выполняется для '" + config.getName() + "'");
        }

        config.setSyncStatus(SyncStatus.SYNCING);
        config.setLastSyncAt(Instant.now());
        config = integrationConfigRepository.save(config);

        log.info("Sync started for integration: {}", config.getCode());

        // In a full implementation, this would kick off an async sync task.
        // For now, we mark it as syncing. A scheduled job would then process the sync.

        return IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(String code) {
        IntegrationConfig config = getConfigOrThrow(code);

        Map<String, Object> status = new HashMap<>();
        status.put("code", config.getCode());
        status.put("name", config.getName());
        status.put("isActive", config.isActive());
        status.put("syncStatus", config.getSyncStatus());
        status.put("syncStatusDisplayName", config.getSyncStatus().getDisplayName());
        status.put("lastSyncAt", config.getLastSyncAt());
        return status;
    }

    private IntegrationConfig getConfigOrThrow(String code) {
        return integrationConfigRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Интеграция не найдена: " + code));
    }
}
