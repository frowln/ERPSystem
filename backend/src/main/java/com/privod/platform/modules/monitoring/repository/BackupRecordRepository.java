package com.privod.platform.modules.monitoring.repository;

import com.privod.platform.modules.monitoring.domain.BackupRecord;
import com.privod.platform.modules.monitoring.domain.BackupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BackupRecordRepository extends JpaRepository<BackupRecord, UUID> {

    Page<BackupRecord> findByDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    Optional<BackupRecord> findByStatusAndDeletedFalse(BackupStatus status);

    @Query("SELECT br FROM BackupRecord br WHERE br.deleted = false " +
            "ORDER BY br.createdAt DESC LIMIT 1")
    Optional<BackupRecord> findLatest();
}
