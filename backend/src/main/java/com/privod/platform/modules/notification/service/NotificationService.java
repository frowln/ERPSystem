package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.notification.domain.Notification;
import com.privod.platform.modules.notification.domain.NotificationPriority;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.repository.NotificationRepository;
import com.privod.platform.modules.notification.web.dto.NotificationResponse;
import com.privod.platform.modules.notification.web.dto.SendNotificationRequest;
import com.privod.platform.modules.notification.web.dto.UnreadCountResponse;
import com.privod.platform.modules.notification.web.dto.WebSocketMessage;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketNotificationService webSocketNotificationService;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponse send(SendNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.userId())
                .title(request.title())
                .message(request.message())
                .notificationType(request.notificationType())
                .sourceModel(request.sourceModel())
                .sourceId(request.sourceId())
                .actionUrl(request.actionUrl())
                .priority(request.priority() != null ? request.priority() : NotificationPriority.NORMAL)
                .expiresAt(request.expiresAt())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification sent to user {}: {} ({})", request.userId(), request.title(), notification.getId());

        pushViaWebSocket(notification);

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public NotificationResponse send(UUID userId, String title, String message,
                                      NotificationType type, String sourceModel,
                                      UUID sourceId, String actionUrl) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .notificationType(type)
                .sourceModel(sourceModel)
                .sourceId(sourceId)
                .actionUrl(actionUrl)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification sent to user {}: {} ({})", userId, title, notification.getId());

        pushViaWebSocket(notification);

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UUID userId, Boolean isRead, Pageable pageable) {
        if (isRead != null) {
            return notificationRepository.findByUserIdAndIsReadAndDeletedFalse(userId, isRead, pageable)
                    .map(NotificationResponse::fromEntity);
        }
        return notificationRepository.findByUserIdAndDeletedFalse(userId, pageable)
                .map(NotificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalseAndDeletedFalse(userId);
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId) {
        Notification notification = getNotificationOrThrow(notificationId);
        notification.markRead();
        notification = notificationRepository.save(notification);
        log.debug("Notification marked as read: {}", notificationId);
        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public NotificationResponse markReadForUser(UUID notificationId, UUID userId) {
        Notification notification = getNotificationOrThrow(notificationId);
        if (!notification.getUserId().equals(userId)) {
            // Avoid leaking cross-user existence.
            throw new EntityNotFoundException("Уведомление не найдено: " + notificationId);
        }
        notification.markRead();
        notification = notificationRepository.save(notification);
        log.debug("Notification marked as read for user {}: {}", userId, notificationId);
        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllRead(UUID userId) {
        int updated = notificationRepository.markAllReadForUser(userId, Instant.now());
        log.info("Marked {} notifications as read for user {}", updated, userId);
        return updated;
    }

    @Transactional
    public void deleteNotification(UUID notificationId) {
        Notification notification = getNotificationOrThrow(notificationId);
        notification.softDelete();
        notificationRepository.save(notification);
        log.info("Notification deleted: {}", notificationId);
    }

    @Transactional
    public void deleteNotificationForUser(UUID notificationId, UUID userId) {
        Notification notification = getNotificationOrThrow(notificationId);
        if (!notification.getUserId().equals(userId)) {
            // Avoid leaking cross-user existence.
            throw new EntityNotFoundException("Уведомление не найдено: " + notificationId);
        }
        notification.softDelete();
        notificationRepository.save(notification);
        log.info("Notification deleted for user {}: {}", userId, notificationId);
    }

    @Transactional
    public int deleteOld(int daysOld) {
        Instant before = Instant.now().minus(daysOld, ChronoUnit.DAYS);
        int deleted = notificationRepository.deleteOldRead(before);
        log.info("Deleted {} old read notifications (older than {} days)", deleted, daysOld);
        return deleted;
    }

    @Transactional
    public int deleteExpired() {
        int deleted = notificationRepository.deleteExpired(Instant.now());
        log.info("Deleted {} expired notifications", deleted);
        return deleted;
    }

    private Notification getNotificationOrThrow(UUID id) {
        return notificationRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Уведомление не найдено: " + id));
    }

    /**
     * Resolve the user's email (Spring Security principal) and push the
     * persisted notification through the WebSocket personal queue.
     */
    private void pushViaWebSocket(Notification notification) {
        try {
            User user = userRepository.findById(notification.getUserId()).orElse(null);
            if (user == null) {
                log.warn("Cannot push WebSocket notification: user {} not found", notification.getUserId());
                return;
            }

            WebSocketMessage wsMsg = WebSocketMessage.of(
                    "NOTIFICATION",
                    notification.getSourceModel() != null ? notification.getSourceModel() : notification.getNotificationType().name().toLowerCase(),
                    notification.getSourceId() != null ? notification.getSourceId().toString() : notification.getId().toString(),
                    null,
                    notification.getTitle(),
                    notification.getMessage(),
                    Map.of(
                            "notificationId", notification.getId().toString(),
                            "priority", notification.getPriority().name(),
                            "actionUrl", notification.getActionUrl() != null ? notification.getActionUrl() : ""
                    )
            );

            webSocketNotificationService.sendToUser(user.getEmail(), wsMsg);
        } catch (Exception e) {
            // WebSocket push is best-effort; do not fail the main transaction
            log.error("Failed to push WebSocket notification for user {}: {}",
                    notification.getUserId(), e.getMessage());
        }
    }
}
