package com.privod.platform.modules.closing.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.domain.OneCPostingStatus;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.closing.repository.Ks3DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks3Ks2LinkRepository;
import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.repository.OneCMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
 * Сервис экспорта подписанных КС-2/КС-3 документов в 1С.
 * Вызывается автоматически при подписании документа.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KsOneCExportService {

    private final OneCConfigRepository oneCConfigRepository;
    private final OneCMappingRepository oneCMappingRepository;
    private final Ks2DocumentRepository ks2DocumentRepository;
    private final Ks2LineRepository ks2LineRepository;
    private final Ks3DocumentRepository ks3DocumentRepository;
    private final Ks3Ks2LinkRepository ks3Ks2LinkRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 1С OData entity set name for acts of completed work (КС-2).
     * Standard 1C Accounting: Document_РеализацияТоваровУслуг
     */
    private static final String KS2_ODATA_ENTITY = "Document_РеализацияТоваровУслуг";

    /**
     * 1С OData entity set name for cost certificates (КС-3).
     * Uses the same base document type.
     */
    private static final String KS3_ODATA_ENTITY = "Document_РеализацияТоваровУслуг";

    // ========================= EXPORT ON SIGN =========================

    /**
     * Экспортировать подписанный КС-2 в 1С (async — не блокирует основной поток).
     */
    @Async
    public void exportSignedKs2Async(UUID ks2Id) {
        try {
            exportKs2(ks2Id);
        } catch (Exception e) {
            log.error("Ошибка асинхронного экспорта КС-2 {} в 1С: {}", ks2Id, e.getMessage(), e);
        }
    }

    /**
     * Экспортировать подписанный КС-3 в 1С (async).
     */
    @Async
    public void exportSignedKs3Async(UUID ks3Id) {
        try {
            exportKs3(ks3Id);
        } catch (Exception e) {
            log.error("Ошибка асинхронного экспорта КС-3 {} в 1С: {}", ks3Id, e.getMessage(), e);
        }
    }

    /**
     * Экспорт КС-2 в 1С с обновлением статуса.
     */
    @Transactional
    public void exportKs2(UUID ks2Id) {
        Ks2Document doc = ks2DocumentRepository.findById(ks2Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new IllegalStateException("КС-2 не найден: " + ks2Id));

        if (doc.getStatus() != ClosingDocumentStatus.SIGNED && doc.getStatus() != ClosingDocumentStatus.CLOSED) {
            log.debug("КС-2 {} не подписан, пропуск экспорта в 1С", ks2Id);
            return;
        }

        Optional<OneCConfig> configOpt = findActiveOneCConfig();
        if (configOpt.isEmpty()) {
            log.debug("Нет активной конфигурации 1С, пропуск экспорта КС-2 {}", ks2Id);
            return;
        }

        OneCConfig config = configOpt.get();
        List<Ks2Line> lines = ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id);

        try {
            Map<String, Object> data = mapKs2ToOneC(doc, lines);
            String oneCId = sendToOneC(config, KS2_ODATA_ENTITY, "ks2", doc.getId(), data);

            doc.setOneCPostingStatus(OneCPostingStatus.SENT);
            doc.setOneCDocumentId(oneCId);
            ks2DocumentRepository.save(doc);

            log.info("КС-2 {} экспортирован в 1С (ID: {})", doc.getNumber(), oneCId);
        } catch (Exception e) {
            doc.setOneCPostingStatus(OneCPostingStatus.ERROR);
            ks2DocumentRepository.save(doc);
            log.error("Ошибка экспорта КС-2 {} в 1С: {}", doc.getNumber(), e.getMessage());
            throw new RuntimeException("Ошибка экспорта КС-2 в 1С: " + e.getMessage(), e);
        }
    }

    /**
     * Экспорт КС-3 в 1С с обновлением статуса.
     */
    @Transactional
    public void exportKs3(UUID ks3Id) {
        Ks3Document doc = ks3DocumentRepository.findById(ks3Id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new IllegalStateException("КС-3 не найден: " + ks3Id));

        if (doc.getStatus() != ClosingDocumentStatus.SIGNED && doc.getStatus() != ClosingDocumentStatus.CLOSED) {
            log.debug("КС-3 {} не подписан, пропуск экспорта в 1С", ks3Id);
            return;
        }

        Optional<OneCConfig> configOpt = findActiveOneCConfig();
        if (configOpt.isEmpty()) {
            log.debug("Нет активной конфигурации 1С, пропуск экспорта КС-3 {}", ks3Id);
            return;
        }

        OneCConfig config = configOpt.get();

        try {
            Map<String, Object> data = mapKs3ToOneC(doc);
            String oneCId = sendToOneC(config, KS3_ODATA_ENTITY, "ks3", doc.getId(), data);

            doc.setOneCPostingStatus(OneCPostingStatus.SENT);
            doc.setOneCDocumentId(oneCId);
            ks3DocumentRepository.save(doc);

            log.info("КС-3 {} экспортирован в 1С (ID: {})", doc.getNumber(), oneCId);
        } catch (Exception e) {
            doc.setOneCPostingStatus(OneCPostingStatus.ERROR);
            ks3DocumentRepository.save(doc);
            log.error("Ошибка экспорта КС-3 {} в 1С: {}", doc.getNumber(), e.getMessage());
            throw new RuntimeException("Ошибка экспорта КС-3 в 1С: " + e.getMessage(), e);
        }
    }

    // ========================= SYNC POSTING STATUS FROM 1C =========================

    /**
     * Проверить статус проведения всех отправленных КС-2/КС-3 в 1С.
     * Вызывается планировщиком.
     */
    @Transactional
    public void syncPostingStatuses() {
        Optional<OneCConfig> configOpt = findActiveOneCConfig();
        if (configOpt.isEmpty()) return;

        OneCConfig config = configOpt.get();

        // Check KS-2 documents with SENT status
        List<Ks2Document> sentKs2 = ks2DocumentRepository.findByOneCPostingStatusAndDeletedFalse(OneCPostingStatus.SENT);
        for (Ks2Document doc : sentKs2) {
            try {
                checkAndUpdatePostingStatus(config, "ks2", doc.getId(), doc.getOneCDocumentId());
            } catch (Exception e) {
                log.warn("Ошибка проверки статуса КС-2 {} в 1С: {}", doc.getNumber(), e.getMessage());
            }
        }

        // Check KS-3 documents with SENT status
        List<Ks3Document> sentKs3 = ks3DocumentRepository.findByOneCPostingStatusAndDeletedFalse(OneCPostingStatus.SENT);
        for (Ks3Document doc : sentKs3) {
            try {
                checkAndUpdatePostingStatus(config, "ks3", doc.getId(), doc.getOneCDocumentId());
            } catch (Exception e) {
                log.warn("Ошибка проверки статуса КС-3 {} в 1С: {}", doc.getNumber(), e.getMessage());
            }
        }
    }

    private void checkAndUpdatePostingStatus(OneCConfig config, String entityType,
                                              UUID privodId, String oneCDocumentId) {
        if (oneCDocumentId == null || oneCDocumentId.isBlank()) return;

        String odataEntity = entityType.equals("ks2") ? KS2_ODATA_ENTITY : KS3_ODATA_ENTITY;
        String url = buildODataUrl(config, odataEntity + "(guid'" + oneCDocumentId + "')?$format=json&$select=Posted");

        try {
            HttpHeaders headers = buildAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getBody() != null) {
                JsonNode node = objectMapper.readTree(response.getBody());
                boolean posted = node.path("Posted").asBoolean(false);
                if (!posted) {
                    posted = node.path("d").path("Posted").asBoolean(false);
                }

                if (posted) {
                    if (entityType.equals("ks2")) {
                        ks2DocumentRepository.findById(privodId).ifPresent(doc -> {
                            doc.setOneCPostingStatus(OneCPostingStatus.POSTED);
                            doc.setOneCPostedAt(Instant.now());
                            ks2DocumentRepository.save(doc);
                            log.info("КС-2 {} проведён в 1С", doc.getNumber());
                        });
                    } else {
                        ks3DocumentRepository.findById(privodId).ifPresent(doc -> {
                            doc.setOneCPostingStatus(OneCPostingStatus.POSTED);
                            doc.setOneCPostedAt(Instant.now());
                            ks3DocumentRepository.save(doc);
                            log.info("КС-3 {} проведён в 1С", doc.getNumber());
                        });
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Не удалось проверить статус проведения {} {} в 1С: {}",
                    entityType, privodId, e.getMessage());
        }
    }

    // ========================= ENTITY MAPPERS =========================

    private Map<String, Object> mapKs2ToOneC(Ks2Document doc, List<Ks2Line> lines) {
        Map<String, Object> data = new HashMap<>();
        data.put("Date", doc.getDocumentDate().toString() + "T00:00:00");
        data.put("Number", doc.getNumber());
        data.put("Комментарий", doc.getNotes() != null ? doc.getNotes() : "КС-2 из ПРИВОД");
        data.put("СуммаДокумента", doc.getTotalWithVat());

        // Map lines as tabular section
        List<Map<String, Object>> lineItems = new ArrayList<>();
        for (Ks2Line line : lines) {
            Map<String, Object> lineData = new HashMap<>();
            lineData.put("Содержание", line.getName());
            lineData.put("Количество", line.getQuantity());
            lineData.put("Цена", line.getUnitPrice());
            lineData.put("Сумма", line.getAmount());
            lineData.put("СтавкаНДС", mapVatRate(line.getVatRate()));
            lineData.put("СуммаНДС", line.getVatAmount());
            lineData.put("ЕдиницаИзмерения", line.getUnitOfMeasure() != null ? line.getUnitOfMeasure() : "шт");
            lineItems.add(lineData);
        }
        data.put("Услуги", lineItems);

        return data;
    }

    private Map<String, Object> mapKs3ToOneC(Ks3Document doc) {
        Map<String, Object> data = new HashMap<>();
        data.put("Date", doc.getDocumentDate().toString() + "T00:00:00");
        data.put("Number", doc.getNumber());
        data.put("Комментарий",
                "КС-3 из ПРИВОД. Период: " +
                        (doc.getPeriodFrom() != null ? doc.getPeriodFrom() : "") +
                        " — " +
                        (doc.getPeriodTo() != null ? doc.getPeriodTo() : ""));
        data.put("СуммаДокумента", doc.getTotalAmount());
        return data;
    }

    private String mapVatRate(java.math.BigDecimal vatRate) {
        if (vatRate == null) return "БезНДС";
        int rate = vatRate.intValue();
        return switch (rate) {
            case 0 -> "БезНДС";
            case 10 -> "НДС10";
            case 20 -> "НДС20";
            default -> "НДС" + rate;
        };
    }

    // ========================= HELPERS =========================

    private String sendToOneC(OneCConfig config, String odataEntity, String entityType,
                               UUID privodId, Map<String, Object> data) throws Exception {
        HttpHeaders headers = buildAuthHeaders(config);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String jsonBody = objectMapper.writeValueAsString(data);

        // Check if mapping already exists (re-export)
        Optional<OneCMapping> existingMapping = oneCMappingRepository
                .findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, entityType);

        if (existingMapping.isPresent()) {
            // Update existing document in 1C
            String url = buildODataUrl(config, odataEntity
                    + "(guid'" + existingMapping.get().getOneCId() + "')");
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);

            existingMapping.get().setLastSyncAt(Instant.now());
            existingMapping.get().setSyncStatus(OneCMappingSyncStatus.SYNCED);
            oneCMappingRepository.save(existingMapping.get());
            return existingMapping.get().getOneCId();
        }

        // Create new document in 1C
        String url = buildODataUrl(config, odataEntity);
        HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, request, String.class);

        String oneCId = null;
        if (response.getBody() != null) {
            JsonNode responseNode = objectMapper.readTree(response.getBody());
            oneCId = responseNode.path("Ref_Key").asText(null);
            if (oneCId == null) {
                oneCId = responseNode.path("d").path("Ref_Key").asText(null);
            }

            // Save mapping
            OneCMapping mapping = OneCMapping.builder()
                    .entityType(entityType)
                    .privodId(privodId)
                    .oneCId(oneCId != null ? oneCId : "")
                    .oneCCode(responseNode.path("Number").asText(""))
                    .syncStatus(OneCMappingSyncStatus.SYNCED)
                    .lastSyncAt(Instant.now())
                    .build();
            oneCMappingRepository.save(mapping);
        }

        return oneCId;
    }

    private Optional<OneCConfig> findActiveOneCConfig() {
        List<OneCConfig> configs = oneCConfigRepository.findByIsActiveAndDeletedFalse(true);
        return configs.stream().findFirst();
    }

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
}
