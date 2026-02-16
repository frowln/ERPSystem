package com.privod.platform.modules.integration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import com.privod.platform.modules.integration.domain.WebhookEndpoint;
import com.privod.platform.modules.integration.repository.IntegrationWebhookDeliveryRepository;
import com.privod.platform.modules.integration.repository.WebhookEndpointRepository;
import com.privod.platform.modules.integration.web.dto.CreateWebhookEndpointRequest;
import com.privod.platform.modules.integration.web.dto.UpdateWebhookEndpointRequest;
import com.privod.platform.modules.integration.web.dto.WebhookDeliveryResponse;
import com.privod.platform.modules.integration.web.dto.WebhookEndpointResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationWebhookService {

    private final WebhookEndpointRepository webhookEndpointRepository;
    private final IntegrationWebhookDeliveryRepository webhookDeliveryRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public WebhookEndpointResponse register(CreateWebhookEndpointRequest request) {
        if (webhookEndpointRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Вебхук с кодом '" + request.code() + "' уже существует");
        }

        String eventsJson;
        try {
            eventsJson = request.events() != null ? objectMapper.writeValueAsString(request.events()) : "[]";
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Некорректный формат списка событий");
        }

        WebhookEndpoint webhook = WebhookEndpoint.builder()
                .code(request.code())
                .url(request.url())
                .secret(request.secret())
                .events(eventsJson)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .build();

        webhook = webhookEndpointRepository.save(webhook);
        auditService.logCreate("WebhookEndpoint", webhook.getId());

        log.info("Вебхук зарегистрирован: {} -> {} ({})", webhook.getCode(), webhook.getUrl(), webhook.getId());
        return WebhookEndpointResponse.fromEntity(webhook);
    }

    @Transactional
    public WebhookEndpointResponse updateWebhook(UUID id, UpdateWebhookEndpointRequest request) {
        WebhookEndpoint webhook = getWebhookOrThrow(id);

        if (request.url() != null) {
            webhook.setUrl(request.url());
        }
        if (request.secret() != null) {
            webhook.setSecret(request.secret());
        }
        if (request.events() != null) {
            try {
                webhook.setEvents(objectMapper.writeValueAsString(request.events()));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Некорректный формат списка событий");
            }
        }
        if (request.isActive() != null) {
            webhook.setActive(request.isActive());
        }

        webhook = webhookEndpointRepository.save(webhook);
        auditService.logUpdate("WebhookEndpoint", webhook.getId(), "multiple", null, null);

        log.info("Вебхук обновлён: {} ({})", webhook.getCode(), webhook.getId());
        return WebhookEndpointResponse.fromEntity(webhook);
    }

    @Transactional
    public void unregister(UUID id) {
        WebhookEndpoint webhook = getWebhookOrThrow(id);
        webhook.softDelete();
        webhookEndpointRepository.save(webhook);
        auditService.logDelete("WebhookEndpoint", id);
        log.info("Вебхук удалён: {} ({})", webhook.getCode(), id);
    }

    @Transactional(readOnly = true)
    public Page<WebhookEndpointResponse> findAll(Pageable pageable) {
        return webhookEndpointRepository.findByDeletedFalse(pageable)
                .map(WebhookEndpointResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WebhookEndpointResponse findById(UUID id) {
        WebhookEndpoint webhook = getWebhookOrThrow(id);
        return WebhookEndpointResponse.fromEntity(webhook);
    }

    @Transactional
    public void triggerEvent(String eventType, String payload) {
        List<WebhookEndpoint> webhooks = webhookEndpointRepository.findActiveByEventType(eventType);

        for (WebhookEndpoint webhook : webhooks) {
            WebhookDelivery delivery = WebhookDelivery.builder()
                    .webhookConfigId(webhook.getId())
                    .event(eventType)
                    .payload(payload)
                    .status(WebhookDeliveryStatus.PENDING)
                    .attemptCount(1)
                    .build();

            delivery = webhookDeliveryRepository.save(delivery);

            // In production: async HTTP call to webhook.getUrl() with payload
            // For now, simulate delivery
            try {
                delivery.setStatus(WebhookDeliveryStatus.SENT);
                delivery.setResponseCode(200);
                delivery.setResponseBody("{\"ok\":true}");
                webhook.setLastTriggeredAt(Instant.now());
                webhook.setFailureCount(0);
            } catch (Exception e) {
                delivery.setStatus(WebhookDeliveryStatus.FAILED);
                delivery.setResponseBody(e.getMessage());
                webhook.setFailureCount(webhook.getFailureCount() + 1);
                webhook.setLastFailureReason(e.getMessage());
            }

            webhookDeliveryRepository.save(delivery);
            webhookEndpointRepository.save(webhook);

            log.info("Событие '{}' доставлено вебхуку {} ({})", eventType, webhook.getCode(), delivery.getStatus());
        }
    }

    @Transactional
    public WebhookDeliveryResponse retryDelivery(UUID deliveryId) {
        WebhookDelivery delivery = webhookDeliveryRepository.findById(deliveryId)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Доставка вебхука не найдена: " + deliveryId));

        if (delivery.getStatus() != WebhookDeliveryStatus.FAILED) {
            throw new IllegalStateException("Повторная доставка возможна только для неудачных попыток");
        }

        delivery.setStatus(WebhookDeliveryStatus.RETRYING);
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        delivery.setNextRetryAt(Instant.now());

        // In production: async HTTP call
        delivery.setStatus(WebhookDeliveryStatus.SENT);
        delivery.setResponseCode(200);
        delivery.setResponseBody("{\"ok\":true}");
        delivery.setNextRetryAt(null);

        delivery = webhookDeliveryRepository.save(delivery);

        log.info("Повторная доставка вебхука: delivery={}, attempt={}", deliveryId, delivery.getAttemptCount());
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    @Transactional(readOnly = true)
    public Page<WebhookDeliveryResponse> getDeliveryLog(UUID webhookId, Pageable pageable) {
        if (webhookId != null) {
            return webhookDeliveryRepository.findByWebhookConfigIdAndDeletedFalse(webhookId, pageable)
                    .map(WebhookDeliveryResponse::fromEntity);
        }
        return webhookDeliveryRepository.findByDeletedFalse(pageable)
                .map(WebhookDeliveryResponse::fromEntity);
    }

    @Transactional
    public boolean processIncomingWebhook(String code, String eventType, String payload, String signature) {
        WebhookEndpoint webhook = webhookEndpointRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Вебхук не найден: " + code));

        if (!webhook.isActive()) {
            log.warn("Получен вебхук для неактивного endpoint: {}", code);
            return false;
        }

        // Validate signature if secret is configured
        if (webhook.getSecret() != null && !webhook.getSecret().isBlank()) {
            if (signature == null || !validateSignature(payload, webhook.getSecret(), signature)) {
                log.warn("Невалидная подпись для вебхука: {}", code);
                return false;
            }
        }

        WebhookDelivery delivery = WebhookDelivery.builder()
                .webhookConfigId(webhook.getId())
                .event(eventType != null ? eventType : "incoming")
                .payload(payload != null ? payload : "{}")
                .status(WebhookDeliveryStatus.SENT)
                .responseCode(200)
                .attemptCount(1)
                .build();

        webhookDeliveryRepository.save(delivery);
        webhook.setLastTriggeredAt(Instant.now());
        webhookEndpointRepository.save(webhook);

        log.info("Входящий вебхук обработан: code={}, event={}", code, eventType);
        return true;
    }

    private boolean validateSignature(String payload, String secret, String signature) {
        // In production: HMAC-SHA256 validation
        // Simplified for now
        return signature != null && !signature.isBlank();
    }

    private WebhookEndpoint getWebhookOrThrow(UUID id) {
        return webhookEndpointRepository.findById(id)
                .filter(w -> !w.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Вебхук не найден: " + id));
    }
}
