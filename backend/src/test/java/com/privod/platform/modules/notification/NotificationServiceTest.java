package com.privod.platform.modules.notification;

import com.privod.platform.modules.notification.domain.Notification;
import com.privod.platform.modules.notification.domain.NotificationPriority;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.repository.NotificationRepository;
import com.privod.platform.modules.notification.service.NotificationService;
import com.privod.platform.modules.notification.web.dto.NotificationResponse;
import com.privod.platform.modules.notification.web.dto.SendNotificationRequest;
import com.privod.platform.modules.notification.web.dto.UnreadCountResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID notifId;
    private UUID userId;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        notifId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testNotification = Notification.builder()
                .userId(userId)
                .title("Новая задача назначена")
                .message("Вам назначена задача: Подготовка фундамента")
                .notificationType(NotificationType.TASK)
                .sourceModel("task")
                .sourceId(UUID.randomUUID())
                .actionUrl("/tasks/" + UUID.randomUUID())
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .build();
        testNotification.setId(notifId);
        testNotification.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Send Notification")
    class SendTests {

        @Test
        @DisplayName("Should send notification with default priority")
        void sendNotification_DefaultPriority() {
            SendNotificationRequest request = new SendNotificationRequest(
                    userId, "Согласование контракта",
                    "Контракт КД-001 требует вашего согласования",
                    NotificationType.APPROVAL,
                    "contract", UUID.randomUUID(),
                    "/contracts/approve",
                    null, null
            );

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            NotificationResponse response = notificationService.send(request);

            assertThat(response.notificationType()).isEqualTo(NotificationType.APPROVAL);
            assertThat(response.priority()).isEqualTo(NotificationPriority.NORMAL);
            assertThat(response.isRead()).isFalse();
            assertThat(response.title()).isEqualTo("Согласование контракта");
        }

        @Test
        @DisplayName("Should send notification via simplified method")
        void sendNotification_SimplifiedMethod() {
            UUID sourceId = UUID.randomUUID();

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            NotificationResponse response = notificationService.send(
                    userId, "Системное обновление", "Плановое обновление системы в 23:00",
                    NotificationType.SYSTEM, "system", sourceId, null
            );

            assertThat(response.notificationType()).isEqualTo(NotificationType.SYSTEM);
            assertThat(response.sourceModel()).isEqualTo("system");
        }
    }

    @Nested
    @DisplayName("Mark Read")
    class MarkReadTests {

        @Test
        @DisplayName("Should mark notification as read")
        void markRead_Success() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(testNotification));
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationResponse response = notificationService.markRead(notifId);

            assertThat(response.isRead()).isTrue();
            assertThat(response.readAt()).isNotNull();
        }

        @Test
        @DisplayName("Should throw when notification not found")
        void markRead_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(notificationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markRead(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Уведомление не найдено");
        }
    }

    @Nested
    @DisplayName("Unread Count")
    class UnreadCountTests {

        @Test
        @DisplayName("Should return unread count")
        void getUnreadCount_Success() {
            when(notificationRepository.countByUserIdAndIsReadFalseAndDeletedFalse(userId)).thenReturn(5L);

            UnreadCountResponse response = notificationService.getUnreadCount(userId);

            assertThat(response.unreadCount()).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("Mark All Read")
    class MarkAllReadTests {

        @Test
        @DisplayName("Should mark all notifications as read for user")
        void markAllRead_Success() {
            when(notificationRepository.markAllReadForUser(any(UUID.class), any(Instant.class))).thenReturn(3);

            int count = notificationService.markAllRead(userId);

            assertThat(count).isEqualTo(3);
            verify(notificationRepository).markAllReadForUser(any(UUID.class), any(Instant.class));
        }
    }
}
