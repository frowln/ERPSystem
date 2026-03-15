package com.privod.platform.modules.apiManagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.apiManagement.domain.RetryPolicy;
import com.privod.platform.modules.apiManagement.domain.WebhookConfig;
import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import com.privod.platform.modules.apiManagement.repository.WebhookConfigRepository;
import com.privod.platform.modules.apiManagement.repository.ApiWebhookDeliveryRepository;
import com.privod.platform.modules.apiManagement.web.dto.CreateWebhookConfigRequest;
import com.privod.platform.modules.apiManagement.web.dto.UpdateWebhookConfigRequest;
import com.privod.platform.modules.apiManagement.web.dto.WebhookConfigResponse;
import com.privod.platform.modules.apiManagement.web.dto.WebhookDeliveryResponse;
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
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Duration SECRET_ROTATION_GRACE_PERIOD = Duration.ofHours(24);

    private final WebhookConfigRepository configRepository;
    private final ApiWebhookDeliveryRepository deliveryRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    // --- Config operations ---

    @Transactional(readOnly = true)
    public WebhookConfigResponse findConfigById(UUID id) {
        WebhookConfig config = getConfigOrThrow(id);
        return WebhookConfigResponse.fromEntity(config);
    }

    @Transactional(readOnly = true)
    public Page<WebhookConfigResponse> findAllConfigs(Pageable pageable) {
        return configRepository.findByDeletedFalseOrderByCreatedAtDesc(pageable)
                .map(WebhookConfigResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<WebhookConfigResponse> findActiveConfigs() {
        return configRepository.findByIsActiveTrueAndDeletedFalse()
                .stream()
                .map(WebhookConfigResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WebhookConfigResponse createConfig(CreateWebhookConfigRequest request) {
        WebhookConfig config = WebhookConfig.builder()
                .name(request.name())
                .url(request.url())
                .secret(request.secret())
                .events(request.events() != null ? request.events() : "[]")
                .isActive(true)
                .retryPolicy(request.retryPolicy() != null ? request.retryPolicy() : RetryPolicy.EXPONENTIAL)
                .resourceFilter(request.resourceFilter() != null ? request.resourceFilter() : "{}")
                .build();

        config = configRepository.save(config);
        auditService.logCreate("WebhookConfig", config.getId());

        log.info("Webhook config created: {} -> {} ({})", config.getName(), config.getUrl(), config.getId());
        return WebhookConfigResponse.fromEntity(config);
    }

    @Transactional
    public WebhookConfigResponse updateConfig(UUID id, UpdateWebhookConfigRequest request) {
        WebhookConfig config = getConfigOrThrow(id);

        if (request.name() != null) {
            config.setName(request.name());
        }
        if (request.url() != null) {
            config.setUrl(request.url());
        }
        if (request.secret() != null) {
            // When rotating: move old primary secret to secondary, set rotation timestamp
            if (config.getSecret() != null && !config.getSecret().isBlank()
                    && !config.getSecret().equals(request.secret())) {
                config.setSecondarySecret(config.getSecret());
                config.setSecretRotationAt(Instant.now());
            }
            config.setSecret(request.secret());
        }
        if (request.events() != null) {
            config.setEvents(request.events());
        }
        if (request.isActive() != null) {
            config.setActive(request.isActive());
        }
        if (request.retryPolicy() != null) {
            config.setRetryPolicy(request.retryPolicy());
        }
        if (request.secondarySecret() != null) {
            config.setSecondarySecret(request.secondarySecret());
            config.setSecretRotationAt(Instant.now());
        }
        if (request.resourceFilter() != null) {
            config.setResourceFilter(request.resourceFilter());
        }

        config = configRepository.save(config);
        auditService.logUpdate("WebhookConfig", config.getId(), "multiple", null, null);

        log.info("Webhook config updated: {} ({})", config.getName(), config.getId());
        return WebhookConfigResponse.fromEntity(config);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        WebhookConfig config = getConfigOrThrow(id);
        config.softDelete();
        configRepository.save(config);
        auditService.logDelete("WebhookConfig", id);
        log.info("Webhook config soft-deleted: {} ({})", config.getName(), id);
    }

    // --- Delivery operations ---

    @Transactional(readOnly = true)
    public Page<WebhookDeliveryResponse> findDeliveries(UUID configId, Pageable pageable) {
        return deliveryRepository.findByWebhookConfigIdAndDeletedFalseOrderBySentAtDesc(configId, pageable)
                .map(WebhookDeliveryResponse::fromEntity);
    }

    @Transactional
    public WebhookDeliveryResponse createDelivery(UUID configId, String event, String payload) {
        getConfigOrThrow(configId);

        WebhookDelivery delivery = WebhookDelivery.builder()
                .webhookConfigId(configId)
                .event(event)
                .payload(payload != null ? payload : "{}")
                .status(WebhookDeliveryStatus.PENDING)
                .build();

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery created: event={} for config {} ({})", event, configId, delivery.getId());
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    @Transactional
    public WebhookDeliveryResponse markDelivered(UUID deliveryId, int responseCode, String responseBody) {
        WebhookDelivery delivery = getDeliveryOrThrow(deliveryId);
        delivery.setStatus(WebhookDeliveryStatus.SENT);
        delivery.setResponseCode(responseCode);
        delivery.setResponseBody(responseBody);
        delivery.setDeliveredAt(Instant.now());
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery completed: {} (response: {})", deliveryId, responseCode);
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    @Transactional
    public WebhookDeliveryResponse markFailed(UUID deliveryId, int responseCode, String responseBody, Instant nextRetryAt) {
        WebhookDelivery delivery = getDeliveryOrThrow(deliveryId);
        delivery.setResponseCode(responseCode);
        delivery.setResponseBody(responseBody);
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);

        if (nextRetryAt != null) {
            delivery.setStatus(WebhookDeliveryStatus.RETRYING);
            delivery.setNextRetryAt(nextRetryAt);
        } else {
            delivery.setStatus(WebhookDeliveryStatus.FAILED);
        }

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery failed: {} (attempt: {}, will retry: {})",
                deliveryId, delivery.getAttemptCount(), nextRetryAt != null);
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    // --- Webhook dispatch with dual-secret and resource filter ---

    /**
     * Dispatches a webhook event to all active configs subscribed to this event type.
     * Applies resource filtering and dual-secret signing during rotation grace period.
     *
     * @param eventType the event type (e.g. "task.created", "project.updated")
     * @param payload   JSON payload to deliver
     */
    @Transactional
    public void dispatchEvent(String eventType, String payload) {
        List<WebhookConfig> activeConfigs = configRepository.findByIsActiveTrueAndDeletedFalse();

        for (WebhookConfig config : activeConfigs) {
            // Check if the config is subscribed to this event type
            if (!isSubscribedToEvent(config, eventType)) {
                continue;
            }

            // Check resource filter: skip if the payload doesn't match
            if (!matchesResourceFilter(config, payload)) {
                log.debug("Webhook {} skipped: resource filter does not match for event {}",
                        config.getId(), eventType);
                continue;
            }

            WebhookDelivery delivery = WebhookDelivery.builder()
                    .webhookConfigId(config.getId())
                    .event(eventType)
                    .payload(payload != null ? payload : "{}")
                    .status(WebhookDeliveryStatus.PENDING)
                    .attemptCount(0)
                    .build();

            delivery = deliveryRepository.save(delivery);
            executeDelivery(delivery, config);
        }
    }

    // --- Internal delivery execution ---

    private void executeDelivery(WebhookDelivery delivery, WebhookConfig config) {
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        delivery.setSentAt(Instant.now());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Event", delivery.getEvent());
            headers.set("X-Webhook-Delivery", delivery.getId().toString());
            headers.set("X-Webhook-Timestamp", String.valueOf(Instant.now().getEpochSecond()));

            // Primary HMAC-SHA256 signature
            if (config.getSecret() != null && !config.getSecret().isBlank()) {
                String signature = computeHmacSignature(delivery.getPayload(), config.getSecret());
                headers.set("X-Webhook-Signature", "sha256=" + signature);
            }

            // Secondary (old) signature during rotation grace period
            if (isInRotationGracePeriod(config)) {
                String oldSignature = computeHmacSignature(delivery.getPayload(), config.getSecondarySecret());
                headers.set("X-Webhook-Signature-Old", "sha256=" + oldSignature);
            }

            HttpEntity<String> requestEntity = new HttpEntity<>(delivery.getPayload(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    config.getUrl(), HttpMethod.POST, requestEntity, String.class);

            delivery.setResponseCode(response.getStatusCode().value());
            delivery.setResponseBody(truncate(response.getBody(), 2000));
            delivery.setDeliveredAt(Instant.now());

            if (response.getStatusCode().is2xxSuccessful()) {
                delivery.setStatus(WebhookDeliveryStatus.SENT);
                delivery.setNextRetryAt(null);
                config.setLastTriggeredAt(Instant.now());
                config.setFailureCount(0);
                config.setLastFailureMessage(null);
            } else {
                handleDeliveryFailure(delivery, config,
                        "HTTP " + response.getStatusCode().value());
            }
        } catch (Exception e) {
            handleDeliveryFailure(delivery, config, e.getMessage());
        }

        deliveryRepository.save(delivery);
        configRepository.save(config);

        log.info("Webhook delivery: config={}, event={}, status={}, attempt={}",
                config.getName(), delivery.getEvent(), delivery.getStatus(), delivery.getAttemptCount());
    }

    private void handleDeliveryFailure(WebhookDelivery delivery, WebhookConfig config, String reason) {
        config.setFailureCount(config.getFailureCount() + 1);
        config.setLastFailureAt(Instant.now());
        config.setLastFailureMessage(truncate(reason, 2000));

        if (delivery.getAttemptCount() < 3) {
            long delaySeconds = (long) Math.pow(4, delivery.getAttemptCount()) * 15;
            delivery.setStatus(WebhookDeliveryStatus.RETRYING);
            delivery.setNextRetryAt(Instant.now().plusSeconds(delaySeconds));
        } else {
            delivery.setStatus(WebhookDeliveryStatus.FAILED);
            delivery.setNextRetryAt(null);
        }
    }

    // --- HMAC & filter helpers ---

    private String computeHmacSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error computing HMAC signature: {}", e.getMessage());
            throw new RuntimeException("Error computing webhook signature", e);
        }
    }

    /**
     * Checks whether the secondary secret is set and the rotation happened within the last 24 hours.
     */
    private boolean isInRotationGracePeriod(WebhookConfig config) {
        if (config.getSecondarySecret() == null || config.getSecondarySecret().isBlank()) {
            return false;
        }
        if (config.getSecretRotationAt() == null) {
            return false;
        }
        return Duration.between(config.getSecretRotationAt(), Instant.now())
                .compareTo(SECRET_ROTATION_GRACE_PERIOD) < 0;
    }

    /**
     * Checks if the webhook config is subscribed to the given event type.
     * Events stored as JSON array, e.g. ["task.created","project.updated"].
     * Empty array or "[]" means subscribe to all events.
     */
    private boolean isSubscribedToEvent(WebhookConfig config, String eventType) {
        String events = config.getEvents();
        if (events == null || events.isBlank() || "[]".equals(events.trim())) {
            return true; // no filter = subscribe to all
        }
        try {
            JsonNode eventsNode = objectMapper.readTree(events);
            if (!eventsNode.isArray() || eventsNode.isEmpty()) {
                return true;
            }
            for (JsonNode node : eventsNode) {
                if (eventType.equals(node.asText())) {
                    return true;
                }
            }
            return false;
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse events JSON for webhook {}: {}", config.getId(), e.getMessage());
            return true; // on parse error, deliver anyway
        }
    }

    /**
     * Checks if the event payload matches the webhook's resource filter.
     * Resource filter is a JSON object like {"projectId": "uuid-value"}.
     * Each key in the filter must exist in the payload with the same value.
     * Empty filter ({}) matches everything.
     */
    private boolean matchesResourceFilter(WebhookConfig config, String payload) {
        String filter = config.getResourceFilter();
        if (filter == null || filter.isBlank() || "{}".equals(filter.trim())) {
            return true; // no filter = match all
        }

        try {
            JsonNode filterNode = objectMapper.readTree(filter);
            if (!filterNode.isObject() || filterNode.isEmpty()) {
                return true;
            }

            JsonNode payloadNode = objectMapper.readTree(payload != null ? payload : "{}");

            Iterator<Map.Entry<String, JsonNode>> fields = filterNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String key = entry.getKey();
                String expectedValue = entry.getValue().asText();

                // Check top-level payload field
                JsonNode payloadValue = payloadNode.get(key);
                if (payloadValue == null || !expectedValue.equals(payloadValue.asText())) {
                    return false;
                }
            }
            return true;
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse resource filter or payload for webhook {}: {}",
                    config.getId(), e.getMessage());
            return true; // on parse error, deliver anyway
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private WebhookConfig getConfigOrThrow(UUID id) {
        return configRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация вебхука не найдена: " + id));
    }

    private WebhookDelivery getDeliveryOrThrow(UUID id) {
        return deliveryRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Доставка вебхука не найдена: " + id));
    }
}
