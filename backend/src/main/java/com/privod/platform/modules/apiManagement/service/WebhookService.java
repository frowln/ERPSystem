package com.privod.platform.modules.apiManagement.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebhookConfigRepository configRepository;
    private final ApiWebhookDeliveryRepository deliveryRepository;
    private final AuditService auditService;

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
