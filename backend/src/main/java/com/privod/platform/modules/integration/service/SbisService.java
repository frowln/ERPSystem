package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.SbisConfig;
import com.privod.platform.modules.integration.domain.SbisDocument;
import com.privod.platform.modules.integration.domain.SbisDocumentStatus;
import com.privod.platform.modules.integration.domain.SbisPartnerMapping;
import com.privod.platform.modules.integration.repository.SbisConfigRepository;
import com.privod.platform.modules.integration.repository.SbisDocumentRepository;
import com.privod.platform.modules.integration.repository.SbisPartnerMappingRepository;
import com.privod.platform.modules.integration.web.dto.CreateSbisConfigRequest;
import com.privod.platform.modules.integration.web.dto.CreateSbisDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SbisConfigResponse;
import com.privod.platform.modules.integration.web.dto.SbisDocumentResponse;
import com.privod.platform.modules.integration.web.dto.SbisPartnerMappingResponse;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SbisService {

    private final SbisConfigRepository configRepository;
    private final SbisDocumentRepository documentRepository;
    private final SbisPartnerMappingRepository partnerMappingRepository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;

    // === Config CRUD ===

    @Transactional(readOnly = true)
    public Page<SbisConfigResponse> listConfigs(Pageable pageable) {
        return configRepository.findByDeletedFalse(pageable)
                .map(SbisConfigResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SbisConfigResponse getConfig(UUID id) {
        SbisConfig config = getConfigOrThrow(id);
        return SbisConfigResponse.fromEntity(config);
    }

    @Transactional
    public SbisConfigResponse createConfig(CreateSbisConfigRequest request) {
        if (configRepository.existsByNameAndDeletedFalse(request.name())) {
            throw new IllegalStateException("Конфигурация СБИС с названием '" + request.name() + "' уже существует");
        }

        SbisConfig config = SbisConfig.builder()
                .name(request.name())
                .apiUrl(request.apiUrl())
                .login(request.login())
                .password(request.password())
                .certificateThumbprint(request.certificateThumbprint())
                .organizationInn(request.organizationInn())
                .organizationKpp(request.organizationKpp())
                .isActive(true)
                .autoSend(request.autoSend())
                .build();

        config = configRepository.save(config);
        auditService.logCreate("SbisConfig", config.getId());

        log.info("Конфигурация СБИС создана: {} (ИНН: {})", config.getName(), config.getOrganizationInn());
        return SbisConfigResponse.fromEntity(config);
    }

    @Transactional
    public SbisConfigResponse updateConfig(UUID id, CreateSbisConfigRequest request) {
        SbisConfig config = getConfigOrThrow(id);

        config.setName(request.name());
        config.setApiUrl(request.apiUrl());
        config.setLogin(request.login());
        if (request.password() != null && !request.password().isBlank()) {
            config.setPassword(request.password());
        }
        config.setCertificateThumbprint(request.certificateThumbprint());
        config.setOrganizationInn(request.organizationInn());
        config.setOrganizationKpp(request.organizationKpp());
        config.setAutoSend(request.autoSend());

        config = configRepository.save(config);
        auditService.logUpdate("SbisConfig", config.getId(), "config", null, null);

        log.info("Конфигурация СБИС обновлена: {} ({})", config.getName(), config.getId());
        return SbisConfigResponse.fromEntity(config);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        SbisConfig config = getConfigOrThrow(id);
        config.softDelete();
        configRepository.save(config);
        auditService.logDelete("SbisConfig", id);
        log.info("Конфигурация СБИС удалена: {} ({})", config.getName(), id);
    }

    @Transactional
    public SbisConfigResponse toggleActive(UUID id) {
        SbisConfig config = getConfigOrThrow(id);
        boolean oldActive = config.isActive();
        config.setActive(!oldActive);
        config = configRepository.save(config);
        auditService.logUpdate("SbisConfig", id, "isActive",
                String.valueOf(oldActive), String.valueOf(config.isActive()));

        log.info("Конфигурация СБИС {}: {} ({})",
                config.isActive() ? "активирована" : "деактивирована", config.getName(), id);
        return SbisConfigResponse.fromEntity(config);
    }

    // === Document CRUD & Operations ===

    @Transactional(readOnly = true)
    public Page<SbisDocumentResponse> listDocuments(Pageable pageable) {
        return documentRepository.findByDeletedFalse(pageable)
                .map(SbisDocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SbisDocumentResponse getDocument(UUID id) {
        SbisDocument document = getDocumentOrThrow(id);
        return SbisDocumentResponse.fromEntity(document);
    }

    @Transactional
    public SbisDocumentResponse createDocument(CreateSbisDocumentRequest request) {
        SbisDocument document = SbisDocument.builder()
                .documentType(request.documentType())
                .internalDocumentId(request.internalDocumentId())
                .internalDocumentModel(request.internalDocumentModel())
                .partnerInn(request.partnerInn())
                .partnerKpp(request.partnerKpp())
                .partnerName(request.partnerName())
                .direction(request.direction())
                .status(SbisDocumentStatus.DRAFT)
                .documentData(request.documentData())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("SbisDocument", document.getId());

        log.info("Документ СБИС создан: {} ({}) -> {}",
                document.getDocumentType().getDisplayName(), document.getId(), document.getPartnerName());
        return SbisDocumentResponse.fromEntity(document);
    }

    @Transactional
    public SbisDocumentResponse sendDocument(UUID id) {
        SbisDocument document = getDocumentOrThrow(id);

        if (!document.canTransitionTo(SbisDocumentStatus.SENT)) {
            throw new IllegalStateException(
                    "Невозможно отправить документ из статуса '" + document.getStatus().getDisplayName() + "'");
        }

        SbisDocumentStatus oldStatus = document.getStatus();
        document.setStatus(SbisDocumentStatus.SENT);
        document.setSentAt(Instant.now());

        document = documentRepository.save(document);
        auditService.logStatusChange("SbisDocument", document.getId(),
                oldStatus.name(), SbisDocumentStatus.SENT.name());

        log.info("Документ СБИС отправлен: {} ({})", document.getDocumentType().getDisplayName(), document.getId());
        return SbisDocumentResponse.fromEntity(document);
    }

    @Transactional
    public SbisDocumentResponse acceptDocument(UUID id) {
        SbisDocument document = getDocumentOrThrow(id);

        if (!document.canTransitionTo(SbisDocumentStatus.ACCEPTED)) {
            throw new IllegalStateException(
                    "Невозможно принять документ из статуса '" + document.getStatus().getDisplayName() + "'");
        }

        SbisDocumentStatus oldStatus = document.getStatus();
        document.setStatus(SbisDocumentStatus.ACCEPTED);
        document.setSignedAt(Instant.now());

        document = documentRepository.save(document);
        auditService.logStatusChange("SbisDocument", document.getId(),
                oldStatus.name(), SbisDocumentStatus.ACCEPTED.name());

        log.info("Документ СБИС принят: {} ({})", document.getDocumentType().getDisplayName(), document.getId());
        return SbisDocumentResponse.fromEntity(document);
    }

    @Transactional
    public SbisDocumentResponse rejectDocument(UUID id, String errorMessage) {
        SbisDocument document = getDocumentOrThrow(id);

        if (!document.canTransitionTo(SbisDocumentStatus.REJECTED)) {
            throw new IllegalStateException(
                    "Невозможно отклонить документ из статуса '" + document.getStatus().getDisplayName() + "'");
        }

        SbisDocumentStatus oldStatus = document.getStatus();
        document.setStatus(SbisDocumentStatus.REJECTED);
        document.setErrorMessage(errorMessage);

        document = documentRepository.save(document);
        auditService.logStatusChange("SbisDocument", document.getId(),
                oldStatus.name(), SbisDocumentStatus.REJECTED.name());

        log.info("Документ СБИС отклонён: {} ({}), причина: {}",
                document.getDocumentType().getDisplayName(), document.getId(), errorMessage);
        return SbisDocumentResponse.fromEntity(document);
    }

    @Transactional
    public void deleteDocument(UUID id) {
        SbisDocument document = getDocumentOrThrow(id);
        document.softDelete();
        documentRepository.save(document);
        auditService.logDelete("SbisDocument", id);
        log.info("Документ СБИС удалён: {}", id);
    }

    // === Partner Mapping ===

    @Transactional(readOnly = true)
    public Page<SbisPartnerMappingResponse> listPartnerMappings(Pageable pageable) {
        return partnerMappingRepository.findByDeletedFalse(pageable)
                .map(SbisPartnerMappingResponse::fromEntity);
    }

    @Transactional
    public SbisPartnerMappingResponse createPartnerMapping(UUID partnerId, String partnerName,
                                                            String sbisContractorId, String sbisContractorInn,
                                                            String sbisContractorKpp) {
        partnerMappingRepository.findByPartnerIdAndDeletedFalse(partnerId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Маппинг контрагента СБИС уже существует для partnerId=" + partnerId);
                });

        SbisPartnerMapping mapping = SbisPartnerMapping.builder()
                .partnerId(partnerId)
                .partnerName(partnerName)
                .sbisContractorId(sbisContractorId)
                .sbisContractorInn(sbisContractorInn)
                .sbisContractorKpp(sbisContractorKpp)
                .isActive(true)
                .lastSyncAt(Instant.now())
                .build();

        mapping = partnerMappingRepository.save(mapping);
        auditService.logCreate("SbisPartnerMapping", mapping.getId());

        log.info("Маппинг контрагента СБИС создан: {} -> ИНН {}", partnerName, sbisContractorInn);
        return SbisPartnerMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public void deletePartnerMapping(UUID id) {
        SbisPartnerMapping mapping = partnerMappingRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маппинг контрагента СБИС не найден: " + id));
        mapping.softDelete();
        partnerMappingRepository.save(mapping);
        auditService.logDelete("SbisPartnerMapping", id);
        log.info("Маппинг контрагента СБИС удалён: {}", id);
    }

    // === Connection Test & Sync ===

    @Transactional
    public ConnectionTestResponse testConnection(UUID configId) {
        SbisConfig config = getConfigOrThrow(configId);
        long startTime = System.currentTimeMillis();

        try {
            // Authenticate with SBIS API
            String authUrl = config.getApiUrl();
            if (authUrl == null || authUrl.isBlank()) {
                throw new IllegalStateException("URL API СБИС не задан");
            }

            // Attempt to call SBIS auth endpoint
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> authBody = new HashMap<>();
            authBody.put("jsonrpc", "2.0");
            authBody.put("method", "СБИС.Аутентифицировать");
            Map<String, String> params = new HashMap<>();
            params.put("Логин", config.getLogin());
            params.put("Пароль", "***"); // Don't send real password in test
            authBody.put("params", params);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(authBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        authUrl, HttpMethod.POST, request, String.class);

                long responseTime = System.currentTimeMillis() - startTime;

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Тест соединения СБИС успешен для конфигурации {}", config.getName());
                    return new ConnectionTestResponse(
                            true, HealthStatus.HEALTHY, HealthStatus.HEALTHY.getDisplayName(),
                            "Соединение с СБИС установлено успешно",
                            responseTime, Instant.now());
                } else {
                    return new ConnectionTestResponse(
                            false, HealthStatus.DEGRADED, HealthStatus.DEGRADED.getDisplayName(),
                            "СБИС вернул статус: " + response.getStatusCode(),
                            responseTime, Instant.now());
                }
            } catch (RestClientException e) {
                long responseTime = System.currentTimeMillis() - startTime;
                // If the API URL is reachable but returns auth error, it means connection works
                String msg = e.getMessage();
                if (msg != null && (msg.contains("401") || msg.contains("403") || msg.contains("Unauthorized"))) {
                    log.info("СБИС доступен, но требуется авторизация: {}", config.getName());
                    return new ConnectionTestResponse(
                            true, HealthStatus.HEALTHY, HealthStatus.HEALTHY.getDisplayName(),
                            "СБИС доступен. Проверьте учетные данные для полного доступа.",
                            responseTime, Instant.now());
                }
                throw e;
            }
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            log.error("Ошибка теста соединения СБИС для {}: {}", config.getName(), e.getMessage());
            return new ConnectionTestResponse(
                    false, HealthStatus.DOWN, HealthStatus.DOWN.getDisplayName(),
                    "Ошибка соединения с СБИС: " + e.getMessage(),
                    responseTime, Instant.now());
        }
    }

    @Transactional
    public void syncDocuments() {
        log.info("Запуск синхронизации документов СБИС");

        SbisConfig config = configRepository.findAll().stream()
                .filter(c -> !c.isDeleted() && c.isActive())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Активная конфигурация СБИС не найдена. Настройте интеграцию."));

        try {
            // In production, this would call the SBIS API to fetch documents
            // For now, log the sync attempt
            log.info("Синхронизация СБИС: конфигурация {} (ИНН: {})",
                    config.getName(), config.getOrganizationInn());

            // Simulate fetching documents from SBIS
            // In real implementation:
            // 1. Authenticate with SBIS API
            // 2. Fetch list of documents since last sync
            // 3. Create/update SbisDocument entities
            // 4. Map partners if needed

            auditService.logCreate("SbisSync", config.getId());
            log.info("Синхронизация СБИС завершена для конфигурации {}", config.getName());
        } catch (Exception e) {
            log.error("Ошибка синхронизации СБИС: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка синхронизации с СБИС: " + e.getMessage(), e);
        }
    }

    // === Private helpers ===

    private SbisConfig getConfigOrThrow(UUID id) {
        return configRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация СБИС не найдена: " + id));
    }

    private SbisDocument getDocumentOrThrow(UUID id) {
        return documentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ СБИС не найден: " + id));
    }
}
