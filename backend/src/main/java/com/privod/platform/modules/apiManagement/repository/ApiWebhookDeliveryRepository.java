package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.WebhookDelivery;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApiWebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID>, JpaSpecificationExecutor<WebhookDelivery> {

    Page<WebhookDelivery> findByWebhookConfigIdAndDeletedFalseOrderBySentAtDesc(
            UUID webhookConfigId, Pageable pageable);

    Page<WebhookDelivery> findByStatusAndDeletedFalseOrderByCreatedAtAsc(
            WebhookDeliveryStatus status, Pageable pageable);

    @Query("SELECT d FROM WebhookDelivery d WHERE d.deleted = false " +
            "AND d.status = 'RETRYING' AND d.nextRetryAt <= :now " +
            "ORDER BY d.nextRetryAt ASC")
    List<WebhookDelivery> findReadyForRetry(@Param("now") Instant now);

    List<WebhookDelivery> findByWebhookConfigIdAndDeletedFalse(UUID webhookConfigId);
}
