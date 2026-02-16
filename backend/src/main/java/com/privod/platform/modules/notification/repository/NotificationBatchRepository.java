package com.privod.platform.modules.notification.repository;

import com.privod.platform.modules.notification.domain.BatchStatus;
import com.privod.platform.modules.notification.domain.NotificationBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationBatchRepository extends JpaRepository<NotificationBatch, UUID> {

    Page<NotificationBatch> findByDeletedFalse(Pageable pageable);

    List<NotificationBatch> findByStatusAndDeletedFalse(BatchStatus status);

    Page<NotificationBatch> findByCreatedByIdAndDeletedFalse(UUID createdById, Pageable pageable);
}
