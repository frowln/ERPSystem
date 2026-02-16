package com.privod.platform.modules.apiManagement.repository;

import com.privod.platform.modules.apiManagement.domain.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, UUID> {

    Optional<IdempotencyRecord> findByIdempotencyKeyAndDeletedFalse(String idempotencyKey);

    @Query("SELECT r FROM IdempotencyRecord r WHERE r.deleted = false " +
            "AND r.expiresAt < :now")
    List<IdempotencyRecord> findExpiredRecords(@Param("now") Instant now);
}
