package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.channelId = :channelId AND m.parentMessageId IS NULL " +
            "AND m.deleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByChannelId(@Param("channelId") UUID channelId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.parentMessageId = :parentId AND m.deleted = false ORDER BY m.createdAt ASC")
    Page<Message> findByParentMessageId(@Param("parentId") UUID parentId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.channelId = :channelId AND m.isPinned = true AND m.deleted = false " +
            "ORDER BY m.pinnedAt DESC")
    List<Message> findPinnedByChannelId(@Param("channelId") UUID channelId);

    @Query("SELECT m FROM Message m WHERE m.channelId = :channelId AND m.deleted = false " +
            "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.createdAt DESC")
    Page<Message> searchInChannel(@Param("channelId") UUID channelId, @Param("query") String query, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.deleted = false " +
            "AND m.channelId IN (SELECT cm.channelId FROM ChannelMember cm WHERE cm.userId = :userId AND cm.deleted = false) " +
            "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.createdAt DESC")
    Page<Message> searchGlobal(@Param("userId") UUID userId, @Param("query") String query, Pageable pageable);
}
