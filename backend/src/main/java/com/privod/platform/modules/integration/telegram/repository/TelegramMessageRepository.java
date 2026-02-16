package com.privod.platform.modules.integration.telegram.repository;

import com.privod.platform.modules.integration.telegram.domain.TelegramMessage;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageStatus;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TelegramMessageRepository extends JpaRepository<TelegramMessage, UUID> {

    Page<TelegramMessage> findByDeletedFalse(Pageable pageable);

    Page<TelegramMessage> findByStatusAndDeletedFalse(TelegramMessageStatus status, Pageable pageable);

    Page<TelegramMessage> findByChatIdAndDeletedFalse(String chatId, Pageable pageable);

    Page<TelegramMessage> findByMessageTypeAndDeletedFalse(TelegramMessageType messageType, Pageable pageable);

    List<TelegramMessage> findByStatusAndDeletedFalseOrderByCreatedAtAsc(TelegramMessageStatus status);

    long countByStatusAndDeletedFalse(TelegramMessageStatus status);

    @Query("SELECT m FROM TelegramMessage m WHERE m.deleted = false " +
            "AND m.relatedEntityType = :entityType AND m.relatedEntityId = :entityId " +
            "ORDER BY m.createdAt DESC")
    List<TelegramMessage> findByRelatedEntity(
            @Param("entityType") String entityType,
            @Param("entityId") UUID entityId);

    @Modifying
    @Query("UPDATE TelegramMessage m SET m.deleted = true " +
            "WHERE m.deleted = false AND m.createdAt < :before")
    int deleteOldMessages(@Param("before") Instant before);
}
