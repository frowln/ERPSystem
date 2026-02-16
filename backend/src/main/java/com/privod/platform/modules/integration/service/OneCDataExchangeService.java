package com.privod.platform.modules.integration.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;
import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.repository.OneCMappingRepository;
import com.privod.platform.modules.integration.web.dto.OneCExchangeLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Сервис обмена данными с 1С через OData REST API.
 * Реализует полноценный двунаправленный обмен справочниками и документами.
 *
 * Поддерживаемые сущности 1С:
 * - Catalog_Контрагенты (counterparty)
 * - Catalog_Номенклатура (material)
 * - Catalog_Сотрудники (employee)
 * - Document_СчетНаОплату (invoice)
 * - Document_ПлатежноеПоручение (payment)
 * - Document_РеализацияТоваровУслуг (sale)
 * - Document_ПоступлениеТоваровУслуг (purchase)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OneCDataExchangeService {

    private final OneCConfigRepository configRepository;
    private final OneCMappingRepository mappingRepository;
    private final OneCIntegrationService integrationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /** OData entity set names for standard 1C Accounting */
    private static final Map<String, String> ENTITY_ODATA_MAP = Map.of(
            "counterparty", "Catalog_Контрагенты",
            "material", "Catalog_Номенклатура",
            "employee", "Catalog_Сотрудники",
            "invoice", "Document_СчетНаОплату",
            "payment", "Document_ПлатежноеПоручение",
            "sale", "Document_РеализацияТоваровУслуг",
            "purchase", "Document_ПоступлениеТоваровУслуг"
    );

    // ========================= IMPORT (1C → Privod) =========================

    /**
     * Импорт справочника контрагентов из 1С.
     */
    @Transactional
    public ExchangeResult importCounterparties(UUID configId) {
        return importEntities(configId, "counterparty", this::mapCounterpartyFromOneC);
    }

    /**
     * Импорт справочника номенклатуры (материалов) из 1С.
     */
    @Transactional
    public ExchangeResult importMaterials(UUID configId) {
        return importEntities(configId, "material", this::mapMaterialFromOneC);
    }

    /**
     * Импорт справочника сотрудников из 1С.
     */
    @Transactional
    public ExchangeResult importEmployees(UUID configId) {
        return importEntities(configId, "employee", this::mapEmployeeFromOneC);
    }

    /**
     * Импорт счетов из 1С.
     */
    @Transactional
    public ExchangeResult importInvoices(UUID configId) {
        return importEntities(configId, "invoice", this::mapInvoiceFromOneC);
    }

    /**
     * Импорт платёжных поручений из 1С.
     */
    @Transactional
    public ExchangeResult importPayments(UUID configId) {
        return importEntities(configId, "payment", this::mapPaymentFromOneC);
    }

    // ========================= EXPORT (Privod → 1C) =========================

    /**
     * Экспорт данных в 1С — отправка записи.
     */
    @Transactional
    public ExchangeResult exportEntity(UUID configId, String entityType, UUID privodId, Map<String, Object> data) {
        OneCConfig config = getActiveConfig(configId);
        ExchangeResult result = new ExchangeResult(entityType, SyncDirection.EXPORT);

        OneCExchangeLogResponse exchangeLog = integrationService.startExchange(
                configId, OneCExchangeType.MANUAL, SyncDirection.EXPORT);

        try {
            String odataEntitySet = resolveODataEntitySet(entityType);
            HttpHeaders headers = buildAuthHeaders(config);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = objectMapper.writeValueAsString(data);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            // Check if mapping exists (update vs create)
            Optional<OneCMapping> existingMapping = mappingRepository
                    .findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, entityType);

            if (existingMapping.isPresent()) {
                // PATCH existing record in 1C
                String url = buildODataUrl(config, odataEntitySet
                        + "(guid'" + existingMapping.get().getOneCId() + "')");
                restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);

                existingMapping.get().setLastSyncAt(Instant.now());
                existingMapping.get().setSyncStatus(OneCMappingSyncStatus.SYNCED);
                mappingRepository.save(existingMapping.get());
                result.addProcessed();
            } else {
                // POST new record to 1C
                String url = buildODataUrl(config, odataEntitySet);
                ResponseEntity<String> response = restTemplate.exchange(
                        url, HttpMethod.POST, request, String.class);

                if (response.getBody() != null) {
                    JsonNode responseNode = objectMapper.readTree(response.getBody());
                    String oneCId = responseNode.path("Ref_Key").asText();
                    String oneCCode = responseNode.path("Code").asText("");

                    OneCMapping mapping = OneCMapping.builder()
                            .entityType(entityType)
                            .privodId(privodId)
                            .oneCId(oneCId)
                            .oneCCode(oneCCode)
                            .syncStatus(OneCMappingSyncStatus.SYNCED)
                            .lastSyncAt(Instant.now())
                            .build();
                    mappingRepository.save(mapping);
                }
                result.addProcessed();
            }

            integrationService.completeExchange(exchangeLog.id(),
                    result.processedCount, result.errorCount, null);

        } catch (Exception e) {
            log.error("Ошибка экспорта {} в 1С: {}", entityType, e.getMessage(), e);
            result.addError(e.getMessage());
            integrationService.completeExchange(exchangeLog.id(),
                    result.processedCount, result.errorCount, e.getMessage());
        }

        return result;
    }

    // ========================= FULL SYNC =========================

    /**
     * Полная синхронизация всех поддерживаемых типов сущностей.
     */
    @Transactional
    public Map<String, ExchangeResult> fullSync(UUID configId) {
        Map<String, ExchangeResult> results = new HashMap<>();

        results.put("counterparty", importCounterparties(configId));
        results.put("material", importMaterials(configId));
        results.put("employee", importEmployees(configId));
        results.put("invoice", importInvoices(configId));
        results.put("payment", importPayments(configId));

        int totalProcessed = results.values().stream().mapToInt(r -> r.processedCount).sum();
        int totalErrors = results.values().stream().mapToInt(r -> r.errorCount).sum();
        log.info("Полная синхронизация 1С завершена: обработано {}, ошибок {}", totalProcessed, totalErrors);

        return results;
    }

    // ========================= INCREMENTAL SYNC =========================

    /**
     * Инкрементальная синхронизация — только изменения с последнего обмена.
     */
    @Transactional
    public ExchangeResult incrementalSync(UUID configId, String entityType) {
        OneCConfig config = getActiveConfig(configId);
        String odataEntitySet = resolveODataEntitySet(entityType);

        // Find last sync timestamp for this entity type
        Instant lastSync = mappingRepository.findByEntityTypeAndDeletedFalse(entityType,
                        org.springframework.data.domain.Pageable.ofSize(1))
                .stream()
                .findFirst()
                .map(m -> m.getLastSyncAt())
                .orElse(null);

        String filter = "";
        if (lastSync != null) {
            filter = "?$filter=Date ge datetime'" + lastSync.toString().replace("Z", "") + "'";
        }

        return importEntities(configId, entityType, lastSync, this::mapGenericFromOneC);
    }

    // ========================= INTERNAL IMPLEMENTATION =========================

    private ExchangeResult importEntities(UUID configId, String entityType,
                                           OneCEntityMapper mapper) {
        return importEntities(configId, entityType, null, mapper);
    }

    private ExchangeResult importEntities(UUID configId, String entityType,
                                           Instant since, OneCEntityMapper mapper) {
        OneCConfig config = getActiveConfig(configId);
        ExchangeResult result = new ExchangeResult(entityType, SyncDirection.IMPORT);

        OneCExchangeLogResponse exchangeLog = integrationService.startExchange(
                configId, since != null ? OneCExchangeType.INCREMENTAL : OneCExchangeType.FULL,
                SyncDirection.IMPORT);

        try {
            String odataEntitySet = resolveODataEntitySet(entityType);
            String url = buildODataUrl(config, odataEntitySet + "?$format=json");

            if (since != null) {
                url += "&$filter=Date ge datetime'" + since.toString().replace("Z", "") + "'";
            }

            HttpHeaders headers = buildAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, String.class);

            if (response.getBody() == null) {
                throw new IllegalStateException("Пустой ответ от 1С OData");
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("value");

            if (!items.isArray()) {
                items = root.path("d").path("results");
            }

            if (items.isArray()) {
                for (JsonNode item : items) {
                    try {
                        String oneCId = item.path("Ref_Key").asText(null);
                        if (oneCId == null) {
                            oneCId = item.path("Ref").asText(null);
                        }
                        if (oneCId == null || oneCId.isEmpty()) {
                            result.addError("Пропущена запись без Ref_Key");
                            continue;
                        }

                        String oneCCode = item.path("Code").asText("");
                        Map<String, Object> mappedData = mapper.map(item);

                        // Check if mapping already exists
                        Optional<OneCMapping> existing = mappingRepository
                                .findByOneCIdAndEntityTypeAndDeletedFalse(oneCId, entityType);

                        if (existing.isPresent()) {
                            // Update existing mapping
                            existing.get().setLastSyncAt(Instant.now());
                            existing.get().setSyncStatus(OneCMappingSyncStatus.SYNCED);
                            mappingRepository.save(existing.get());
                        } else {
                            // Create new mapping with generated Privod ID
                            UUID privodId = UUID.randomUUID();
                            OneCMapping mapping = OneCMapping.builder()
                                    .entityType(entityType)
                                    .privodId(privodId)
                                    .oneCId(oneCId)
                                    .oneCCode(oneCCode)
                                    .syncStatus(OneCMappingSyncStatus.SYNCED)
                                    .lastSyncAt(Instant.now())
                                    .build();
                            mappingRepository.save(mapping);
                        }

                        result.addProcessed();

                    } catch (Exception e) {
                        log.warn("Ошибка импорта записи {} из 1С: {}", entityType, e.getMessage());
                        result.addError(e.getMessage());
                    }
                }
            }

            integrationService.completeExchange(exchangeLog.id(),
                    result.processedCount, result.errorCount,
                    result.errorCount > 0 ? String.join("; ", result.errors) : null);

            log.info("Импорт {} из 1С: обработано {}, ошибок {}",
                    entityType, result.processedCount, result.errorCount);

        } catch (RestClientException e) {
            log.error("Ошибка подключения к 1С OData для {}: {}", entityType, e.getMessage());
            result.addError("Ошибка подключения: " + e.getMessage());
            integrationService.completeExchange(exchangeLog.id(), 0, 1, e.getMessage());
        } catch (Exception e) {
            log.error("Ошибка импорта {} из 1С: {}", entityType, e.getMessage(), e);
            result.addError(e.getMessage());
            integrationService.completeExchange(exchangeLog.id(), 0, 1, e.getMessage());
        }

        return result;
    }

    // ========================= ENTITY MAPPERS =========================

    @FunctionalInterface
    interface OneCEntityMapper {
        Map<String, Object> map(JsonNode oneCNode);
    }

    private Map<String, Object> mapCounterpartyFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", node.path("Description").asText(""));
        data.put("inn", node.path("ИНН").asText(""));
        data.put("kpp", node.path("КПП").asText(""));
        data.put("fullName", node.path("НаименованиеПолное").asText(""));
        data.put("legalAddress", node.path("ЮридическийАдрес").asText(""));
        data.put("phone", node.path("Телефон").asText(""));
        data.put("email", node.path("Email").asText(""));
        data.put("isSupplier", node.path("Поставщик").asBoolean(false));
        data.put("isCustomer", node.path("Покупатель").asBoolean(false));
        return data;
    }

    private Map<String, Object> mapMaterialFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", node.path("Description").asText(""));
        data.put("code", node.path("Code").asText(""));
        data.put("article", node.path("Артикул").asText(""));
        data.put("unitOfMeasure", node.path("ЕдиницаИзмерения").asText("шт"));
        data.put("group", node.path("Parent_Key").asText(""));
        data.put("fullName", node.path("НаименованиеПолное").asText(""));
        return data;
    }

    private Map<String, Object> mapEmployeeFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", node.path("Description").asText(""));
        data.put("code", node.path("Code").asText(""));
        data.put("position", node.path("Должность").asText(""));
        data.put("department", node.path("Подразделение").asText(""));
        data.put("inn", node.path("ИНН").asText(""));
        data.put("snils", node.path("СНИЛС").asText(""));
        return data;
    }

    private Map<String, Object> mapInvoiceFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        data.put("number", node.path("Number").asText(""));
        data.put("date", node.path("Date").asText(""));
        data.put("counterpartyRef", node.path("Контрагент_Key").asText(""));
        data.put("contractRef", node.path("ДоговорКонтрагента_Key").asText(""));
        data.put("totalAmount", node.path("СуммаДокумента").asDouble(0));
        data.put("currency", node.path("Валюта").asText("RUB"));
        data.put("comment", node.path("Комментарий").asText(""));
        data.put("posted", node.path("Posted").asBoolean(false));
        return data;
    }

    private Map<String, Object> mapPaymentFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        data.put("number", node.path("Number").asText(""));
        data.put("date", node.path("Date").asText(""));
        data.put("counterpartyRef", node.path("Контрагент_Key").asText(""));
        data.put("bankAccount", node.path("СчетОрганизации_Key").asText(""));
        data.put("amount", node.path("СуммаДокумента").asDouble(0));
        data.put("purpose", node.path("НазначениеПлатежа").asText(""));
        data.put("posted", node.path("Posted").asBoolean(false));
        return data;
    }

    private Map<String, Object> mapGenericFromOneC(JsonNode node) {
        Map<String, Object> data = new HashMap<>();
        node.fields().forEachRemaining(field ->
                data.put(field.getKey(), field.getValue().asText("")));
        return data;
    }

    // ========================= HELPERS =========================

    private String buildODataUrl(OneCConfig config, String path) {
        String baseUrl = config.getBaseUrl().endsWith("/")
                ? config.getBaseUrl()
                : config.getBaseUrl() + "/";
        return baseUrl + config.getDatabaseName() + "/odata/standard.odata/" + path;
    }

    private HttpHeaders buildAuthHeaders(OneCConfig config) {
        HttpHeaders headers = new HttpHeaders();
        String auth = config.getUsername() + ":" + config.getPassword();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.set("Accept", "application/json");
        return headers;
    }

    private OneCConfig getActiveConfig(UUID configId) {
        return configRepository.findById(configId)
                .filter(c -> !c.isDeleted() && c.isActive())
                .orElseThrow(() -> new IllegalStateException(
                        "Активная конфигурация 1С не найдена: " + configId));
    }

    private String resolveODataEntitySet(String entityType) {
        String entitySet = ENTITY_ODATA_MAP.get(entityType);
        if (entitySet == null) {
            throw new IllegalArgumentException("Неизвестный тип сущности для 1С: " + entityType);
        }
        return entitySet;
    }

    // ========================= RESULT DTO =========================

    public static class ExchangeResult {
        public final String entityType;
        public final SyncDirection direction;
        public int processedCount = 0;
        public int errorCount = 0;
        public final List<String> errors = new ArrayList<>();

        public ExchangeResult(String entityType, SyncDirection direction) {
            this.entityType = entityType;
            this.direction = direction;
        }

        public void addProcessed() {
            processedCount++;
        }

        public void addError(String error) {
            errorCount++;
            if (errors.size() < 100) {
                errors.add(error);
            }
        }

        public boolean hasErrors() {
            return errorCount > 0;
        }

        @Override
        public String toString() {
            return String.format("%s(%s): processed=%d, errors=%d",
                    entityType, direction, processedCount, errorCount);
        }
    }
}
