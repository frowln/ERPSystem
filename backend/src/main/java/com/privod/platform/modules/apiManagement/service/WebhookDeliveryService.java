package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import com.privod.platform.modules.apiManagement.repository.ApiWebhookDeliveryRepository;
import com.privod.platform.modules.apiManagement.web.dto.WebhookDeliveryResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryService {

    private final ApiWebhookDeliveryRepository deliveryRepository;

    @Transactional
    public WebhookDeliveryResponse createDelivery(UUID webhookId, String eventType, String payload) {
        WebhookDelivery delivery = WebhookDelivery.builder()
                .webhookConfigId(webhookId)
                .event(eventType)
                .payload(payload != null ? payload : "{}")
                .status(WebhookDeliveryStatus.PENDING)
                .build();

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery created: event={}, webhook={}, delivery={}",
                eventType, webhookId, delivery.getId());
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    @Transactional
    public WebhookDeliveryResponse markDelivered(UUID deliveryId, int statusCode,
                                                  String responseBody, int durationMs) {
        WebhookDelivery delivery = getDeliveryOrThrow(deliveryId);
        delivery.setStatus(WebhookDeliveryStatus.SENT);
        delivery.setResponseCode(statusCode);
        delivery.setResponseBody(responseBody);
        delivery.setDeliveredAt(Instant.now());
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery completed: {} (response: {}, duration: {}ms)",
                deliveryId, statusCode, durationMs);
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    @Transactional
    public WebhookDeliveryResponse markFailed(UUID deliveryId, String errorMessage) {
        WebhookDelivery delivery = getDeliveryOrThrow(deliveryId);
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);

        if (delivery.getAttemptCount() < 3) {
            // Schedule retry with exponential backoff
            long delaySeconds = (long) Math.pow(2, delivery.getAttemptCount()) * 30;
            delivery.setStatus(WebhookDeliveryStatus.RETRYING);
            delivery.setNextRetryAt(Instant.now().plusSeconds(delaySeconds));
        } else {
            delivery.setStatus(WebhookDeliveryStatus.FAILED);
        }
        delivery.setResponseBody(errorMessage);

        delivery = deliveryRepository.save(delivery);
        log.info("Webhook delivery failed: {} (attempt: {}, will retry: {})",
                deliveryId, delivery.getAttemptCount(),
                delivery.getStatus() == WebhookDeliveryStatus.RETRYING);
        return WebhookDeliveryResponse.fromEntity(delivery);
    }

    /**
     * Scheduled task to retry failed webhook deliveries.
     * Runs every 30 seconds.
     */
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void retryFailed() {
        List<WebhookDelivery> readyForRetry = deliveryRepository.findReadyForRetry(Instant.now());

        if (readyForRetry.isEmpty()) {
            return;
        }

        log.info("Retrying {} webhook deliveries", readyForRetry.size());

        for (WebhookDelivery delivery : readyForRetry) {
            try {
                // In production: perform actual HTTP call to webhook URL
                // For now, mark as pending for the webhook dispatch system to pick up
                delivery.setStatus(WebhookDeliveryStatus.PENDING);
                delivery.setNextRetryAt(null);
                deliveryRepository.save(delivery);

                log.debug("Webhook delivery {} queued for retry (attempt: {})",
                        delivery.getId(), delivery.getAttemptCount());
            } catch (Exception e) {
                log.error("Error retrying webhook delivery {}: {}",
                        delivery.getId(), e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<WebhookDeliveryResponse> getDeliveries(UUID webhookId, Pageable pageable) {
        return deliveryRepository.findByWebhookConfigIdAndDeletedFalseOrderBySentAtDesc(webhookId, pageable)
                .map(WebhookDeliveryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<WebhookDeliveryResponse> getDeliveriesByStatus(WebhookDeliveryStatus status, Pageable pageable) {
        return deliveryRepository.findByStatusAndDeletedFalseOrderByCreatedAtAsc(status, pageable)
                .map(WebhookDeliveryResponse::fromEntity);
    }

    private WebhookDelivery getDeliveryOrThrow(UUID id) {
        return deliveryRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Доставка вебхука не найдена: " + id));
    }
}
