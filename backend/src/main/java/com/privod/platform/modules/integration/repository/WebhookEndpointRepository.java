package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.WebhookEndpoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, UUID> {

    Optional<WebhookEndpoint> findByCodeAndDeletedFalse(String code);

    Page<WebhookEndpoint> findByDeletedFalse(Pageable pageable);

    List<WebhookEndpoint> findByIsActiveAndDeletedFalse(boolean isActive);

    @Query("SELECT w FROM WebhookEndpoint w WHERE w.isActive = true AND w.deleted = false " +
            "AND w.events LIKE CONCAT('%', :eventType, '%')")
    List<WebhookEndpoint> findActiveByEventType(@Param("eventType") String eventType);

    boolean existsByCodeAndDeletedFalse(String code);
}
