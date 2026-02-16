package com.privod.platform.modules.ai.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.AiMessage;
import com.privod.platform.modules.ai.domain.AiUsageLog;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.domain.MessageRole;
import com.privod.platform.modules.ai.repository.AiConversationRepository;
import com.privod.platform.modules.ai.repository.AiMessageRepository;
import com.privod.platform.modules.ai.repository.AiUsageLogRepository;
import com.privod.platform.modules.ai.web.dto.AiChatRequest;
import com.privod.platform.modules.ai.web.dto.AiChatResponse;
import com.privod.platform.modules.ai.web.dto.AiConversationResponse;
import com.privod.platform.modules.ai.web.dto.AiMessageResponse;
import com.privod.platform.modules.ai.web.dto.CreateConversationRequest;
import com.privod.platform.modules.ai.web.dto.SendMessageRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiUsageLogRepository usageLogRepository;
    private final AuditService auditService;
    private final AiAssistantService aiAssistantService;

    @Transactional(readOnly = true)
    public Page<AiConversationResponse> findByUser(UUID userId, ConversationStatus status, Pageable pageable) {
        if (status != null) {
            return conversationRepository.findByUserIdAndStatusAndDeletedFalse(userId, status, pageable)
                    .map(AiConversationResponse::fromEntity);
        }
        return conversationRepository.findByUserIdAndDeletedFalse(userId, pageable)
                .map(AiConversationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AiConversationResponse findById(UUID id) {
        AiConversation conversation = getConversationOrThrow(id);
        return AiConversationResponse.fromEntity(conversation);
    }

    @Transactional
    public AiConversationResponse create(CreateConversationRequest request) {
        AiConversation conversation = AiConversation.builder()
                .userId(request.userId())
                .projectId(request.projectId())
                .title(request.title())
                .status(ConversationStatus.ACTIVE)
                .build();

        conversation = conversationRepository.save(conversation);
        auditService.logCreate("AiConversation", conversation.getId());

        log.info("AI conversation created: {} ({})", conversation.getTitle(), conversation.getId());
        return AiConversationResponse.fromEntity(conversation);
    }

    @Transactional
    public AiMessageResponse sendMessage(UUID conversationId, SendMessageRequest request) {
        AiConversation conversation = getConversationOrThrow(conversationId);

        // Delegate to AiAssistantService for actual AI processing
        AiChatRequest chatRequest = new AiChatRequest(request.content(), conversationId);
        AiChatResponse chatResponse = aiAssistantService.chat(chatRequest, conversation.getUserId());

        // Return the assistant's response (the AI service already persisted both messages)
        List<AiMessage> messages = messageRepository
                .findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId);

        // Return the last assistant message
        AiMessage lastAssistantMessage = messages.stream()
                .filter(m -> m.getRole() == MessageRole.ASSISTANT)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("No assistant response generated"));

        log.info("Message sent in conversation {}: AI responded with {} tokens",
                conversationId, chatResponse.tokensUsed());
        return AiMessageResponse.fromEntity(lastAssistantMessage);
    }

    @Transactional(readOnly = true)
    public List<AiMessageResponse> getMessages(UUID conversationId) {
        getConversationOrThrow(conversationId);
        return messageRepository.findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(AiMessageResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AiConversationResponse archive(UUID id) {
        AiConversation conversation = getConversationOrThrow(id);
        conversation.setStatus(ConversationStatus.ARCHIVED);
        conversation = conversationRepository.save(conversation);
        auditService.logStatusChange("AiConversation", id, "ACTIVE", "ARCHIVED");

        log.info("AI conversation archived: {}", id);
        return AiConversationResponse.fromEntity(conversation);
    }

    @Transactional
    public void delete(UUID id) {
        AiConversation conversation = getConversationOrThrow(id);
        conversation.softDelete();
        conversationRepository.save(conversation);
        auditService.logDelete("AiConversation", id);
        log.info("AI conversation soft-deleted: {}", id);
    }

    private AiConversation getConversationOrThrow(UUID id) {
        return conversationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("AI conversation not found: " + id));
    }
}
