package com.privod.platform.modules.integration1c.repository;

import com.privod.platform.modules.integration1c.domain.Integration1cSyncLog;
import com.privod.platform.modules.integration1c.domain.SyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Integration1cSyncLogRepository extends JpaRepository<Integration1cSyncLog, UUID> {

    Page<Integration1cSyncLog> findByConfigId(UUID configId, Pageable pageable);

    List<Integration1cSyncLog> findByConfigIdAndStatus(UUID configId, SyncStatus status);

    Page<Integration1cSyncLog> findByConfigIdOrderByCreatedAtDesc(UUID configId, Pageable pageable);
}
