package com.privod.platform.modules.compliance.repository;

import com.privod.platform.modules.compliance.domain.PiiAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface PiiAccessLogRepository extends JpaRepository<PiiAccessLog, UUID> {

    Page<PiiAccessLog> findByOrganizationIdAndEntityTypeAndEntityIdAndDeletedFalse(
            UUID organizationId, String entityType, UUID entityId, Pageable pageable);

    Page<PiiAccessLog> findByOrganizationIdAndUserIdAndDeletedFalse(
            UUID organizationId, UUID userId, Pageable pageable);

    Page<PiiAccessLog> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query("SELECT COUNT(pal) FROM PiiAccessLog pal WHERE pal.organizationId = :orgId " +
            "AND pal.accessedAt BETWEEN :from AND :to AND pal.deleted = false")
    long countByOrgAndAccessedAtBetween(@Param("orgId") UUID organizationId,
                                        @Param("from") Instant from,
                                        @Param("to") Instant to);
}
