package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailTracking;
import com.privod.platform.modules.messaging.domain.MailTrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MailTrackingRepository extends JpaRepository<MailTracking, UUID> {

    @Query("SELECT t FROM MailTracking t WHERE t.messageId = :messageId AND t.deleted = false " +
            "ORDER BY t.sentAt DESC")
    List<MailTracking> findByMessageId(@Param("messageId") UUID messageId);

    @Query("SELECT t FROM MailTracking t WHERE t.recipientEmail = :email AND t.deleted = false " +
            "ORDER BY t.sentAt DESC")
    List<MailTracking> findByRecipientEmail(@Param("email") String email);

    @Query("SELECT t FROM MailTracking t WHERE t.status = :status AND t.deleted = false " +
            "ORDER BY t.sentAt DESC")
    List<MailTracking> findByStatus(@Param("status") MailTrackingStatus status);

    @Query("SELECT t FROM MailTracking t WHERE t.messageId = :messageId " +
            "AND t.recipientEmail = :email AND t.deleted = false ORDER BY t.sentAt DESC")
    List<MailTracking> findByMessageIdAndRecipientEmail(@Param("messageId") UUID messageId,
                                                        @Param("email") String email);
}
