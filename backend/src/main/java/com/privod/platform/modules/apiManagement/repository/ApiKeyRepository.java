package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.ApiKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID>, JpaSpecificationExecutor<ApiKey> {

    Optional<ApiKey> findByKeyHashAndDeletedFalse(String keyHash);

    Optional<ApiKey> findByKeyHashAndIsActiveTrueAndDeletedFalse(String keyHash);

    Optional<ApiKey> findByPrefixAndDeletedFalse(String prefix);

    Page<ApiKey> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<ApiKey> findByIsActiveTrueAndDeletedFalse();

    @Query("SELECT k FROM ApiKey k WHERE k.deleted = false AND k.isActive = true " +
            "AND k.expiresAt IS NOT NULL AND k.expiresAt < :now")
    List<ApiKey> findExpiredKeys(@Param("now") Instant now);
}
