package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.SyncJob;
import com.privod.platform.modules.integration.domain.SyncJobStatus;
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
public interface SyncJobRepository extends JpaRepository<SyncJob, UUID> {

    Optional<SyncJob> findByCodeAndDeletedFalse(String code);

    Page<SyncJob> findByEndpointIdAndDeletedFalse(UUID endpointId, Pageable pageable);

    Page<SyncJob> findByStatusAndDeletedFalse(SyncJobStatus status, Pageable pageable);

    Page<SyncJob> findByDeletedFalse(Pageable pageable);

    List<SyncJob> findByEndpointIdAndEntityTypeAndDeletedFalseOrderByCreatedAtDesc(
            UUID endpointId, String entityType);

    @Query("SELECT s FROM SyncJob s WHERE s.endpointId = :endpointId AND s.entityType = :entityType " +
            "AND s.deleted = false ORDER BY s.createdAt DESC LIMIT 1")
    Optional<SyncJob> findLastSync(@Param("endpointId") UUID endpointId,
                                    @Param("entityType") String entityType);

    List<SyncJob> findByStatusAndDeletedFalse(SyncJobStatus status);

    @Query(value = "SELECT nextval('sync_job_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
