package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface IntegrationWebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {

    Page<WebhookDelivery> findByWebhookConfigIdAndDeletedFalse(UUID webhookConfigId, Pageable pageable);

    Page<WebhookDelivery> findByDeletedFalse(Pageable pageable);

    List<WebhookDelivery> findByStatusAndNextRetryAtBeforeAndDeletedFalse(
            WebhookDeliveryStatus status, Instant before);

    List<WebhookDelivery> findByWebhookConfigIdAndStatusAndDeletedFalse(UUID webhookConfigId, WebhookDeliveryStatus status);

    long countByWebhookConfigIdAndStatusAndDeletedFalse(UUID webhookConfigId, WebhookDeliveryStatus status);
}
