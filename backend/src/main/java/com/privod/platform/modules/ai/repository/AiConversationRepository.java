package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    Page<AiConversation> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    Page<AiConversation> findByUserIdAndStatusAndDeletedFalse(UUID userId, ConversationStatus status, Pageable pageable);

    Optional<AiConversation> findByIdAndDeletedFalse(UUID id);

    long countByUserIdAndDeletedFalse(UUID userId);
}
