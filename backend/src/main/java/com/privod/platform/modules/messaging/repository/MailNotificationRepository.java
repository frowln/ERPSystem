package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailNotification;
import com.privod.platform.modules.messaging.domain.MailNotificationStatus;
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
public interface MailNotificationRepository extends JpaRepository<MailNotification, UUID> {

    @Query("SELECT n FROM MailNotification n WHERE n.userId = :userId AND n.deleted = false " +
            "ORDER BY n.createdAt DESC")
    Page<MailNotification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM MailNotification n WHERE n.userId = :userId AND n.isRead = false " +
            "AND n.deleted = false ORDER BY n.createdAt DESC")
    Page<MailNotification> findUnreadByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM MailNotification n WHERE n.messageId = :messageId AND n.deleted = false " +
            "ORDER BY n.createdAt DESC")
    List<MailNotification> findByMessageId(@Param("messageId") UUID messageId);

    @Query("SELECT n FROM MailNotification n WHERE n.messageId = :messageId AND n.userId = :userId " +
            "AND n.deleted = false")
    Optional<MailNotification> findByMessageIdAndUserId(@Param("messageId") UUID messageId,
                                                        @Param("userId") UUID userId);

    @Query("SELECT COUNT(n) FROM MailNotification n WHERE n.userId = :userId AND n.isRead = false " +
            "AND n.deleted = false")
    long countUnreadByUserId(@Param("userId") UUID userId);

    @Query("SELECT n FROM MailNotification n WHERE n.status = :status AND n.deleted = false " +
            "ORDER BY n.createdAt ASC")
    List<MailNotification> findByStatus(@Param("status") MailNotificationStatus status);
}
