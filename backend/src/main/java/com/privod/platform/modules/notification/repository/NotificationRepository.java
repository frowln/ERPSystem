package com.privod.platform.modules.notification.repository;

import com.privod.platform.modules.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    Page<Notification> findByUserIdAndIsReadAndDeletedFalse(UUID userId, boolean isRead, Pageable pageable);

    long countByUserIdAndIsReadFalseAndDeletedFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
            "WHERE n.userId = :userId AND n.isRead = false AND n.deleted = false")
    int markAllReadForUser(@Param("userId") UUID userId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.deleted = true " +
            "WHERE n.deleted = false AND n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE Notification n SET n.deleted = true " +
            "WHERE n.deleted = false AND n.isRead = true AND n.createdAt < :before")
    int deleteOldRead(@Param("before") Instant before);
}
