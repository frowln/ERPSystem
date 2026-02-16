package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.WebhookConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, UUID>, JpaSpecificationExecutor<WebhookConfig> {

    Page<WebhookConfig> findByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    List<WebhookConfig> findByIsActiveTrueAndDeletedFalse();
}
