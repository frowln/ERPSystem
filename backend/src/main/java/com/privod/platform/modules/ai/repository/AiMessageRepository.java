package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(UUID conversationId);

    Page<AiMessage> findByConversationIdAndDeletedFalse(UUID conversationId, Pageable pageable);

    long countByConversationIdAndDeletedFalse(UUID conversationId);
}
