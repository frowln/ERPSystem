package com.privod.platform.infrastructure.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, UUID entityId);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, UUID entityId, Pageable pageable);

    List<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId);

    Page<AuditLog> findByTimestampBetween(Instant from, Instant to, Pageable pageable);

    long countByEntityTypeAndAction(String entityType, AuditAction action);
}
