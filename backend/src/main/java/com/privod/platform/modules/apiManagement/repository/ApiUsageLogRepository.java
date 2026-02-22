package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.ApiUsageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApiUsageLogRepository extends JpaRepository<ApiUsageLog, UUID> {

    Page<ApiUsageLog> findByApiKeyIdAndDeletedFalseOrderByRequestedAtDesc(UUID apiKeyId, Pageable pageable);

    Page<ApiUsageLog> findByOrganizationIdAndDeletedFalseOrderByRequestedAtDesc(UUID organizationId, Pageable pageable);

    @Query("SELECT l FROM ApiUsageLog l WHERE l.apiKeyId = :apiKeyId AND l.deleted = false " +
            "AND l.requestedAt >= :from AND l.requestedAt <= :to ORDER BY l.requestedAt DESC")
    List<ApiUsageLog> findByApiKeyIdAndDateRange(
            @Param("apiKeyId") UUID apiKeyId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("SELECT l FROM ApiUsageLog l WHERE l.organizationId = :orgId AND l.deleted = false " +
            "AND l.requestedAt >= :from AND l.requestedAt <= :to ORDER BY l.requestedAt DESC")
    List<ApiUsageLog> findByOrganizationIdAndDateRange(
            @Param("orgId") UUID orgId,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("SELECT l.endpoint, COUNT(l) as cnt FROM ApiUsageLog l " +
            "WHERE l.organizationId = :orgId AND l.deleted = false " +
            "GROUP BY l.endpoint ORDER BY cnt DESC")
    List<Object[]> findTopEndpoints(@Param("orgId") UUID orgId, Pageable pageable);

    @Query("SELECT COUNT(l) FROM ApiUsageLog l WHERE l.apiKeyId = :apiKeyId " +
            "AND l.deleted = false AND l.requestedAt >= :since")
    long countRequestsSince(@Param("apiKeyId") UUID apiKeyId, @Param("since") Instant since);
}
