package com.privod.platform.modules.ai;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.AiMessage;
import com.privod.platform.modules.ai.domain.AiUsageLog;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.domain.MessageRole;
import com.privod.platform.modules.ai.repository.AiConversationRepository;
import com.privod.platform.modules.ai.repository.AiMessageRepository;
import com.privod.platform.modules.ai.repository.AiUsageLogRepository;
import com.privod.platform.modules.ai.service.AiAssistantService;
import com.privod.platform.modules.ai.service.AiConversationService;
import com.privod.platform.modules.ai.web.dto.AiChatResponse;
import com.privod.platform.modules.ai.web.dto.AiConversationResponse;
import com.privod.platform.modules.ai.web.dto.AiMessageResponse;
import com.privod.platform.modules.ai.web.dto.CreateConversationRequest;
import com.privod.platform.modules.ai.web.dto.SendMessageRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiConversationServiceTest {

    @Mock
    private AiConversationRepository conversationRepository;

    @Mock
    private AiMessageRepository messageRepository;

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private AiAssistantService aiAssistantService;

    @InjectMocks
    private AiConversationService conversationService;

    private UUID conversationId;
    private AiConversation testConversation;

    @BeforeEach
    void setUp() {
        conversationId = UUID.randomUUID();
        testConversation = AiConversation.builder()
                .userId(UUID.randomUUID())
                .title("Помощь по смете")
                .status(ConversationStatus.ACTIVE)
                .build();
        testConversation.setId(conversationId);
        testConversation.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Conversation")
    class CreateConversationTests {

        @Test
        @DisplayName("Should create conversation with ACTIVE status")
        void create_SetsActiveStatus() {
            UUID userId = UUID.randomUUID();
            CreateConversationRequest request = new CreateConversationRequest(userId, null, "Новый диалог");

            when(conversationRepository.save(any(AiConversation.class))).thenAnswer(inv -> {
                AiConversation c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            AiConversationResponse response = conversationService.create(request);

            assertThat(response.status()).isEqualTo(ConversationStatus.ACTIVE);
            assertThat(response.title()).isEqualTo("Новый диалог");
            assertThat(response.userId()).isEqualTo(userId);
            verify(auditService).logCreate(eq("AiConversation"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Send Message")
    class SendMessageTests {

        @Test
        @DisplayName("Should send user message and return AI assistant response")
        void sendMessage_Success() {
            when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                    .thenReturn(Optional.of(testConversation));

            // Mock AI assistant service to return a chat response
            AiChatResponse chatResponse = new AiChatResponse(
                    "Стоимость фундамента зависит от типа и площади.", conversationId, 50, "gpt-4o-mini");
            when(aiAssistantService.chat(any(), eq(testConversation.getUserId()))).thenReturn(chatResponse);

            // Mock message retrieval to return the assistant message
            AiMessage assistantMessage = AiMessage.builder()
                    .conversationId(conversationId)
                    .role(MessageRole.ASSISTANT)
                    .content("Стоимость фундамента зависит от типа и площади.")
                    .tokensUsed(50)
                    .model("gpt-4o-mini")
                    .build();
            assistantMessage.setId(UUID.randomUUID());
            assistantMessage.setCreatedAt(Instant.now());
            when(messageRepository.findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId))
                    .thenReturn(List.of(assistantMessage));

            SendMessageRequest request = new SendMessageRequest("Какова стоимость фундамента?");
            AiMessageResponse response = conversationService.sendMessage(conversationId, request);

            assertThat(response.role()).isEqualTo(MessageRole.ASSISTANT);
            assertThat(response.content()).isEqualTo("Стоимость фундамента зависит от типа и площади.");
        }

        @Test
        @DisplayName("Should throw when conversation not found")
        void sendMessage_ConversationNotFound() {
            when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                    .thenReturn(Optional.empty());

            SendMessageRequest request = new SendMessageRequest("Тестовое сообщение");

            assertThatThrownBy(() -> conversationService.sendMessage(conversationId, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Archive Conversation")
    class ArchiveTests {

        @Test
        @DisplayName("Should archive conversation")
        void archive_Success() {
            when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                    .thenReturn(Optional.of(testConversation));
            when(conversationRepository.save(any(AiConversation.class))).thenAnswer(inv -> {
                AiConversation c = inv.getArgument(0);
                c.setCreatedAt(Instant.now());
                return c;
            });

            AiConversationResponse response = conversationService.archive(conversationId);

            assertThat(response.status()).isEqualTo(ConversationStatus.ARCHIVED);
            verify(auditService).logStatusChange("AiConversation", conversationId, "ACTIVE", "ARCHIVED");
        }
    }

    @Test
    @DisplayName("Should find conversation by ID")
    void findById_Success() {
        when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                .thenReturn(Optional.of(testConversation));

        AiConversationResponse response = conversationService.findById(conversationId);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Помощь по смете");
    }

    @Test
    @DisplayName("Should throw when conversation not found by ID")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(conversationRepository.findByIdAndDeletedFalse(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> conversationService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Should soft delete conversation")
    void delete_SoftDeletes() {
        when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                .thenReturn(Optional.of(testConversation));
        when(conversationRepository.save(any(AiConversation.class))).thenReturn(testConversation);

        conversationService.delete(conversationId);

        assertThat(testConversation.isDeleted()).isTrue();
        verify(conversationRepository).save(testConversation);
        verify(auditService).logDelete("AiConversation", conversationId);
    }

    @Test
    @DisplayName("Should return messages in chronological order")
    void getMessages_ReturnsOrdered() {
        AiMessage msg1 = AiMessage.builder()
                .conversationId(conversationId)
                .role(MessageRole.USER)
                .content("Привет")
                .tokensUsed(5)
                .build();
        msg1.setId(UUID.randomUUID());
        msg1.setCreatedAt(Instant.now().minusSeconds(60));

        AiMessage msg2 = AiMessage.builder()
                .conversationId(conversationId)
                .role(MessageRole.ASSISTANT)
                .content("Здравствуйте!")
                .tokensUsed(10)
                .build();
        msg2.setId(UUID.randomUUID());
        msg2.setCreatedAt(Instant.now());

        when(conversationRepository.findByIdAndDeletedFalse(conversationId))
                .thenReturn(Optional.of(testConversation));
        when(messageRepository.findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId))
                .thenReturn(List.of(msg1, msg2));

        List<AiMessageResponse> messages = conversationService.getMessages(conversationId);

        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).role()).isEqualTo(MessageRole.USER);
        assertThat(messages.get(1).role()).isEqualTo(MessageRole.ASSISTANT);
    }
}
