package com.privod.platform.modules.portal;

import com.privod.platform.modules.portal.domain.PortalMessage;
import com.privod.platform.modules.portal.repository.PortalMessageRepository;
import com.privod.platform.modules.portal.service.PortalMessageService;
import com.privod.platform.modules.portal.web.dto.PortalMessageResponse;
import com.privod.platform.modules.portal.web.dto.SendPortalMessageRequest;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortalMessageServiceTest {

    @Mock
    private PortalMessageRepository portalMessageRepository;

    @InjectMocks
    private PortalMessageService portalMessageService;

    private UUID portalUserId;
    private UUID internalUserId;
    private PortalMessage testMessage;

    @BeforeEach
    void setUp() {
        portalUserId = UUID.randomUUID();
        internalUserId = UUID.randomUUID();

        testMessage = PortalMessage.builder()
                .fromPortalUserId(portalUserId)
                .toInternalUserId(internalUserId)
                .projectId(UUID.randomUUID())
                .subject("Вопрос по проекту")
                .content("Когда будет завершен этап №2?")
                .build();
        testMessage.setId(UUID.randomUUID());
        testMessage.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Send Message")
    class SendMessageTests {

        @Test
        @DisplayName("Should send message from portal user to internal user")
        void send_Success() {
            SendPortalMessageRequest request = new SendPortalMessageRequest(
                    null, internalUserId, UUID.randomUUID(),
                    "Вопрос по проекту", "Когда будет завершен этап №2?", null
            );

            when(portalMessageRepository.save(any(PortalMessage.class))).thenAnswer(inv -> {
                PortalMessage msg = inv.getArgument(0);
                msg.setId(UUID.randomUUID());
                msg.setCreatedAt(Instant.now());
                return msg;
            });

            PortalMessageResponse response = portalMessageService.send(portalUserId, null, request);

            assertThat(response.fromPortalUserId()).isEqualTo(portalUserId);
            assertThat(response.toInternalUserId()).isEqualTo(internalUserId);
            assertThat(response.subject()).isEqualTo("Вопрос по проекту");
            assertThat(response.isRead()).isFalse();
        }
    }

    @Nested
    @DisplayName("Mark Read")
    class MarkReadTests {

        @Test
        @DisplayName("Should mark message as read")
        void markRead_Success() {
            when(portalMessageRepository.findById(testMessage.getId()))
                    .thenReturn(Optional.of(testMessage));
            when(portalMessageRepository.save(any(PortalMessage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            PortalMessageResponse response = portalMessageService.markRead(testMessage.getId());

            assertThat(response.isRead()).isTrue();
            assertThat(response.readAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw when message not found")
        void markRead_NotFound() {
            UUID invalidId = UUID.randomUUID();
            when(portalMessageRepository.findById(invalidId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> portalMessageService.markRead(invalidId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Сообщение не найдено");
        }
    }

    @Nested
    @DisplayName("Get Thread")
    class GetThreadTests {

        @Test
        @DisplayName("Should return parent message and replies")
        void getThread_ReturnsParentAndReplies() {
            UUID parentId = testMessage.getId();

            PortalMessage reply = PortalMessage.builder()
                    .fromInternalUserId(internalUserId)
                    .toPortalUserId(portalUserId)
                    .subject("Re: Вопрос по проекту")
                    .content("Этап №2 завершится через 2 недели")
                    .parentMessageId(parentId)
                    .build();
            reply.setId(UUID.randomUUID());
            reply.setCreatedAt(Instant.now());

            when(portalMessageRepository.findById(parentId)).thenReturn(Optional.of(testMessage));
            when(portalMessageRepository.findByParentMessageIdAndDeletedFalseOrderByCreatedAtAsc(parentId))
                    .thenReturn(List.of(reply));

            List<PortalMessageResponse> thread = portalMessageService.getThread(parentId);

            assertThat(thread).hasSize(2);
            assertThat(thread.get(0).subject()).isEqualTo("Вопрос по проекту");
            assertThat(thread.get(1).subject()).isEqualTo("Re: Вопрос по проекту");
        }
    }
}
