package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiContextType;
import com.privod.platform.modules.ai.domain.AiConversationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiConversationContextRepository extends JpaRepository<AiConversationContext, UUID> {

    List<AiConversationContext> findByConversationIdAndDeletedFalse(UUID conversationId);

    Optional<AiConversationContext> findByConversationIdAndContextTypeAndDeletedFalse(
            UUID conversationId, AiContextType contextType);

    Optional<AiConversationContext> findByIdAndDeletedFalse(UUID id);

    List<AiConversationContext> findByEntityIdAndDeletedFalse(UUID entityId);
}
