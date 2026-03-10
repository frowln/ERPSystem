package com.privod.platform.modules.integration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationWebhookService {

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final WebhookEndpointRepository webhookEndpointRepository;
    private final IntegrationWebhookDeliveryRepository webhookDeliveryRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    // ---------------------------------------------------------------------------
    // CRUD operations
    // ---------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------
    // Webhook delivery — real HTTP POST with HMAC signature
    // ---------------------------------------------------------------------------

    /**
     * Delivers a webhook event to all active endpoints subscribed to the given event type.
     * Creates a delivery record, performs an HTTP POST with HMAC signature, and handles
     * retries with exponential backoff (max 3 attempts).
     */
    @Transactional
    public void triggerEvent(String eventType, String payload) {
        List<WebhookEndpoint> webhooks = webhookEndpointRepository.findActiveByEventType(eventType);

        for (WebhookEndpoint webhook : webhooks) {
            WebhookDelivery delivery = WebhookDelivery.builder()
                    .webhookConfigId(webhook.getId())
                    .event(eventType)
                    .payload(payload)
                    .status(WebhookDeliveryStatus.PENDING)
                    .attemptCount(0)
                    .build();

            delivery = webhookDeliveryRepository.save(delivery);
            executeDelivery(delivery, webhook);
        }
    }

    /**
     * Delivers a specific webhook payload to a specific endpoint.
     */
    @Transactional
    public WebhookDeliveryResponse deliverWebhook(UUID endpointId, String eventType, Object payloadObj) {
        WebhookEndpoint webhook = getWebhookOrThrow(endpointId);

        String payload;
        try {
            payload = objectMapper.writeValueAsString(payloadObj);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Ошибка сериализации payload: " + e.getMessage());
        }

        WebhookDelivery delivery = WebhookDelivery.builder()
                .webhookConfigId(endpointId)
                .event(eventType)
                .payload(payload)
                .status(WebhookDeliveryStatus.PENDING)
                .attemptCount(0)
                .build();

        delivery = webhookDeliveryRepository.save(delivery);
        executeDelivery(delivery, webhook);
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    /**
     * Scheduled task: retry failed webhook deliveries every 30 seconds.
     * Picks up deliveries with status RETRYING where nextRetryAt <= now.
     */
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void retryFailedDeliveries() {
        List<WebhookDelivery> readyForRetry = webhookDeliveryRepository
                .findByStatusAndNextRetryAtBeforeAndDeletedFalse(
                        WebhookDeliveryStatus.RETRYING, Instant.now());

        if (readyForRetry.isEmpty()) {
            return;
        }

        log.info("Повтор доставки {} вебхуков", readyForRetry.size());

        for (WebhookDelivery delivery : readyForRetry) {
            try {
                WebhookEndpoint webhook = webhookEndpointRepository.findById(delivery.getWebhookConfigId())
                        .filter(w -> !w.isDeleted())
                        .orElse(null);

                if (webhook == null || !webhook.isActive()) {
                    delivery.setStatus(WebhookDeliveryStatus.FAILED);
                    delivery.setResponseBody("Webhook endpoint not found or inactive");
                    webhookDeliveryRepository.save(delivery);
                    continue;
                }

                executeDelivery(delivery, webhook);
            } catch (Exception e) {
                log.error("Ошибка повторной доставки вебхука {}: {}", delivery.getId(), e.getMessage());
            }
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

        WebhookEndpoint webhook = getWebhookOrThrow(delivery.getWebhookConfigId());

        // Reset attempt count for manual retry
        delivery.setAttemptCount(0);
        delivery.setStatus(WebhookDeliveryStatus.PENDING);
        delivery.setNextRetryAt(null);

        executeDelivery(delivery, webhook);

        log.info("Ручная повторная доставка вебхука: delivery={}, attempt={}", deliveryId, delivery.getAttemptCount());
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

    // ---------------------------------------------------------------------------
    // Incoming webhook processing
    // ---------------------------------------------------------------------------

    @Transactional
    public boolean processIncomingWebhook(String code, String eventType, String payload, String signature) {
        WebhookEndpoint webhook = webhookEndpointRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Вебхук не найден: " + code));

        if (!webhook.isActive()) {
            log.warn("Получен вебхук для неактивного endpoint: {}", code);
            return false;
        }

        // Validate HMAC signature if secret is configured
        if (webhook.getSecret() != null && !webhook.getSecret().isBlank()) {
            if (signature == null || !validateHmacSignature(payload, webhook.getSecret(), signature)) {
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

    // ---------------------------------------------------------------------------
    // Internal: HTTP delivery with HMAC
    // ---------------------------------------------------------------------------

    private void executeDelivery(WebhookDelivery delivery, WebhookEndpoint webhook) {
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        delivery.setSentAt(Instant.now());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Event", delivery.getEvent());
            headers.set("X-Webhook-Delivery", delivery.getId().toString());
            headers.set("X-Webhook-Timestamp", String.valueOf(Instant.now().getEpochSecond()));

            // Compute and add HMAC-SHA256 signature
            if (webhook.getSecret() != null && !webhook.getSecret().isBlank()) {
                String signature = computeHmacSignature(delivery.getPayload(), webhook.getSecret());
                headers.set("X-Webhook-Signature", "sha256=" + signature);
            }

            HttpEntity<String> requestEntity = new HttpEntity<>(delivery.getPayload(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    webhook.getUrl(), HttpMethod.POST, requestEntity, String.class);

            delivery.setResponseCode(response.getStatusCode().value());
            delivery.setResponseBody(truncate(response.getBody(), 2000));
            delivery.setDeliveredAt(Instant.now());

            if (response.getStatusCode().is2xxSuccessful()) {
                delivery.setStatus(WebhookDeliveryStatus.SENT);
                delivery.setNextRetryAt(null);
                webhook.setLastTriggeredAt(Instant.now());
                webhook.setFailureCount(0);
                webhook.setLastFailureReason(null);
            } else {
                handleDeliveryFailure(delivery, webhook,
                        "HTTP " + response.getStatusCode().value());
            }
        } catch (Exception e) {
            handleDeliveryFailure(delivery, webhook, e.getMessage());
        }

        webhookDeliveryRepository.save(delivery);
        webhookEndpointRepository.save(webhook);

        log.info("Доставка вебхука: endpoint={}, event={}, status={}, attempt={}",
                webhook.getCode(), delivery.getEvent(), delivery.getStatus(), delivery.getAttemptCount());
    }

    private void handleDeliveryFailure(WebhookDelivery delivery, WebhookEndpoint webhook, String reason) {
        webhook.setFailureCount(webhook.getFailureCount() + 1);
        webhook.setLastFailureReason(truncate(reason, 500));

        if (delivery.getAttemptCount() < MAX_RETRY_ATTEMPTS) {
            // Exponential backoff: 60s, 240s, 960s
            long delaySeconds = (long) Math.pow(4, delivery.getAttemptCount()) * 15;
            delivery.setStatus(WebhookDeliveryStatus.RETRYING);
            delivery.setNextRetryAt(Instant.now().plusSeconds(delaySeconds));
            log.debug("Вебхук {} будет повторён через {}с (попытка {})",
                    delivery.getId(), delaySeconds, delivery.getAttemptCount());
        } else {
            delivery.setStatus(WebhookDeliveryStatus.FAILED);
            delivery.setNextRetryAt(null);
            log.warn("Доставка вебхука {} окончательно провалена после {} попыток",
                    delivery.getId(), delivery.getAttemptCount());
        }
    }

    // ---------------------------------------------------------------------------
    // HMAC signature helpers
    // ---------------------------------------------------------------------------

    /**
     * Computes HMAC-SHA256 signature for the given payload using the secret.
     */
    private String computeHmacSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Ошибка вычисления HMAC подписи: {}", e.getMessage());
            throw new RuntimeException("Ошибка вычисления подписи вебхука", e);
        }
    }

    /**
     * Validates an incoming webhook HMAC-SHA256 signature.
     */
    private boolean validateHmacSignature(String payload, String secret, String signature) {
        try {
            String expected = computeHmacSignature(payload, secret);
            // Support both "sha256=<hex>" and raw "<hex>" formats
            String actual = signature.startsWith("sha256=") ? signature.substring(7) : signature;
            return expected.equalsIgnoreCase(actual);
        } catch (Exception e) {
            log.error("Ошибка валидации HMAC подписи: {}", e.getMessage());
            return false;
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private WebhookEndpoint getWebhookOrThrow(UUID id) {
        return webhookEndpointRepository.findById(id)
                .filter(w -> !w.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Вебхук не найден: " + id));
    }
}
