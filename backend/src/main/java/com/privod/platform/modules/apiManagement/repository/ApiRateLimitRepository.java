package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.ApiRateLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiRateLimitRepository extends JpaRepository<ApiRateLimit, UUID> {

    Optional<ApiRateLimit> findByApiKeyIdAndDeletedFalse(UUID apiKeyId);

    Optional<ApiRateLimit> findByApiKeyIdAndIsActiveTrueAndDeletedFalse(UUID apiKeyId);
}
