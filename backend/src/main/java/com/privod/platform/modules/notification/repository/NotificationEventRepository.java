package com.privod.platform.modules.notification.repository;

import com.privod.platform.modules.notification.domain.NotificationEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEventEntity, UUID> {

    /**
     * Find all unread events for a user, most recent first.
     */
    List<NotificationEventEntity> findByUserIdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(UUID userId);

    /**
     * Count unread events for a user.
     */
    long countByUserIdAndIsReadFalseAndDeletedFalse(UUID userId);

    /**
     * Paginated list of all events for a user, most recent first.
     */
    Page<NotificationEventEntity> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /**
     * Mark all unread events as read for a user.
     */
    @Modifying
    @Query("UPDATE NotificationEventEntity e SET e.isRead = true " +
            "WHERE e.userId = :userId AND e.isRead = false AND e.deleted = false")
    int markAllReadForUser(@Param("userId") UUID userId);
}
