package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {

    @Query("SELECT r FROM MessageReaction r WHERE r.messageId = :messageId AND r.deleted = false ORDER BY r.createdAt ASC")
    List<MessageReaction> findByMessageId(@Param("messageId") UUID messageId);

    @Query("SELECT r FROM MessageReaction r WHERE r.messageId = :messageId AND r.userId = :userId " +
            "AND r.emoji = :emoji AND r.deleted = false")
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(
            @Param("messageId") UUID messageId,
            @Param("userId") UUID userId,
            @Param("emoji") String emoji);

    @Query("SELECT COUNT(r) > 0 FROM MessageReaction r WHERE r.messageId = :messageId AND r.userId = :userId " +
            "AND r.emoji = :emoji AND r.deleted = false")
    boolean existsByMessageIdAndUserIdAndEmoji(
            @Param("messageId") UUID messageId,
            @Param("userId") UUID userId,
            @Param("emoji") String emoji);

    @Query("SELECT r FROM MessageReaction r WHERE r.messageId IN :messageIds AND r.deleted = false ORDER BY r.createdAt ASC")
    List<MessageReaction> findByMessageIdIn(@Param("messageIds") List<UUID> messageIds);
}
