package com.privod.platform.modules.immutableAudit.repository;

import com.privod.platform.modules.immutableAudit.domain.ImmutableRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImmutableRecordRepository extends JpaRepository<ImmutableRecord, UUID>,
        JpaSpecificationExecutor<ImmutableRecord> {

    Page<ImmutableRecord> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId, Pageable pageable);

    Page<ImmutableRecord> findByEntityTypeAndDeletedFalse(String entityType, Pageable pageable);

    Page<ImmutableRecord> findByDeletedFalse(Pageable pageable);

    Optional<ImmutableRecord> findFirstByEntityTypeAndEntityIdAndDeletedFalseOrderByRecordedAtDesc(
            String entityType, UUID entityId);

    @Query("SELECT r FROM ImmutableRecord r WHERE r.entityType = :entityType AND r.entityId = :entityId " +
            "AND r.deleted = false ORDER BY r.recordedAt ASC")
    List<ImmutableRecord> findChain(@Param("entityType") String entityType, @Param("entityId") UUID entityId);

    long countByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId);
}
