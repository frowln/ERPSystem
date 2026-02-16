package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.notification.domain.Notification;
import com.privod.platform.modules.notification.domain.NotificationPriority;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.repository.NotificationRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID notificationId;
    private UUID userId;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        notificationId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testNotification = Notification.builder()
                .userId(userId)
                .title("Task Assigned")
                .message("You have been assigned a new task")
                .notificationType(NotificationType.TASK)
                .sourceModel("Task")
                .sourceId(UUID.randomUUID())
                .actionUrl("/tasks/123")
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .build();
        testNotification.setId(notificationId);
        testNotification.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Send Notification")
    class SendTests {

        @Test
        @DisplayName("Should send notification via request DTO")
        void shouldSend_viaRequestDto() {
            SendNotificationRequest request = new SendNotificationRequest(
                    userId, "Budget Approved", "Your budget has been approved",
                    NotificationType.APPROVAL, "Budget", UUID.randomUUID(),
                    "/budgets/456", NotificationPriority.HIGH, null);

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            NotificationResponse response = notificationService.send(request);

            assertThat(response.title()).isEqualTo("Budget Approved");
            assertThat(response.priority()).isEqualTo(NotificationPriority.HIGH);
            assertThat(response.isRead()).isFalse();
        }

        @Test
        @DisplayName("Should default priority to NORMAL when null in request")
        void shouldDefaultPriority_whenNull() {
            SendNotificationRequest request = new SendNotificationRequest(
                    userId, "Info", "Some info", NotificationType.INFO,
                    null, null, null, null, null);

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            NotificationResponse response = notificationService.send(request);

            assertThat(response.priority()).isEqualTo(NotificationPriority.NORMAL);
        }

        @Test
        @DisplayName("Should send notification via direct parameters")
        void shouldSend_viaDirectParams() {
            UUID sourceId = UUID.randomUUID();
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                return n;
            });

            NotificationResponse response = notificationService.send(
                    userId, "Warning", "System warning message",
                    NotificationType.WARNING, "System", sourceId, "/system/alerts");

            assertThat(response.notificationType()).isEqualTo(NotificationType.WARNING);
            assertThat(response.priority()).isEqualTo(NotificationPriority.NORMAL);
        }
    }

    @Nested
    @DisplayName("Get Notifications")
    class GetTests {

        @Test
        @DisplayName("Should get all notifications for user")
        void shouldReturnAll_whenNoFilter() {
            Pageable pageable = PageRequest.of(0, 20);
            when(notificationRepository.findByUserIdAndDeletedFalse(userId, pageable))
                    .thenReturn(new PageImpl<>(List.of(testNotification)));

            Page<NotificationResponse> result = notificationService.getMyNotifications(userId, null, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should filter notifications by read status")
        void shouldFilter_byReadStatus() {
            Pageable pageable = PageRequest.of(0, 20);
            when(notificationRepository.findByUserIdAndIsReadAndDeletedFalse(userId, false, pageable))
                    .thenReturn(new PageImpl<>(List.of(testNotification)));

            Page<NotificationResponse> result = notificationService.getMyNotifications(userId, false, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should return unread count")
        void shouldReturnUnreadCount() {
            when(notificationRepository.countByUserIdAndIsReadFalseAndDeletedFalse(userId)).thenReturn(5L);

            UnreadCountResponse response = notificationService.getUnreadCount(userId);

            assertThat(response.count()).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("Mark Notifications")
    class MarkTests {

        @Test
        @DisplayName("Should mark notification as read")
        void shouldMarkRead() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(testNotification));
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationResponse response = notificationService.markRead(notificationId);

            assertThat(response.isRead()).isTrue();
            assertThat(response.readAt()).isNotNull();
        }

        @Test
        @DisplayName("Should mark all notifications as read for user")
        void shouldMarkAllRead() {
            when(notificationRepository.markAllReadForUser(eq(userId), any(Instant.class))).thenReturn(10);

            int updated = notificationService.markAllRead(userId);

            assertThat(updated).isEqualTo(10);
        }
    }

    @Nested
    @DisplayName("Delete Notifications")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete notification")
        void shouldSoftDelete() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(testNotification));
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            notificationService.deleteNotification(notificationId);

            assertThat(testNotification.isDeleted()).isTrue();
        }

        @Test
        @DisplayName("Should delete old read notifications")
        void shouldDeleteOld() {
            when(notificationRepository.deleteOldRead(any(Instant.class))).thenReturn(25);

            int deleted = notificationService.deleteOld(30);

            assertThat(deleted).isEqualTo(25);
        }

        @Test
        @DisplayName("Should delete expired notifications")
        void shouldDeleteExpired() {
            when(notificationRepository.deleteExpired(any(Instant.class))).thenReturn(5);

            int deleted = notificationService.deleteExpired();

            assertThat(deleted).isEqualTo(5);
        }
    }

    @Test
    @DisplayName("Should throw when notification not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(notificationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Уведомление не найдено");
    }
}
