package com.privod.platform.modules.settings.service;

import com.privod.platform.modules.settings.domain.EventType;
import com.privod.platform.modules.settings.domain.NotificationSetting;
import com.privod.platform.modules.settings.domain.NotificationType;
import com.privod.platform.modules.settings.repository.NotificationSettingRepository;
import com.privod.platform.modules.settings.web.dto.BulkNotificationSettingRequest;
import com.privod.platform.modules.settings.web.dto.NotificationSettingResponse;
import com.privod.platform.modules.settings.web.dto.UpdateNotificationSettingRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationSettingService {

    private final NotificationSettingRepository notificationSettingRepository;

    @Transactional(readOnly = true)
    public List<NotificationSettingResponse> getUserSettings(UUID userId) {
        return notificationSettingRepository.findByUserIdAndDeletedFalse(userId)
                .stream()
                .map(NotificationSettingResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationSettingResponse> getUserSettingsByType(UUID userId, NotificationType type) {
        return notificationSettingRepository.findByUserIdAndNotificationTypeAndDeletedFalse(userId, type)
                .stream()
                .map(NotificationSettingResponse::fromEntity)
                .toList();
    }

    @Transactional
    public NotificationSettingResponse updateSetting(UUID userId, UpdateNotificationSettingRequest request) {
        NotificationSetting setting = notificationSettingRepository
                .findByUserIdAndNotificationTypeAndEventTypeAndDeletedFalse(
                        userId, request.notificationType(), request.eventType())
                .orElseGet(() -> NotificationSetting.builder()
                        .userId(userId)
                        .notificationType(request.notificationType())
                        .eventType(request.eventType())
                        .build());

        setting.setEnabled(request.isEnabled());
        setting = notificationSettingRepository.save(setting);

        log.info("Notification setting updated for user {}: {}:{} = {}",
                userId, request.notificationType(), request.eventType(), request.isEnabled());
        return NotificationSettingResponse.fromEntity(setting);
    }

    @Transactional
    public List<NotificationSettingResponse> bulkUpdate(UUID userId, BulkNotificationSettingRequest request) {
        List<NotificationSettingResponse> results = new ArrayList<>();
        for (UpdateNotificationSettingRequest settingRequest : request.settings()) {
            results.add(updateSetting(userId, settingRequest));
        }
        log.info("Bulk notification settings updated for user {}: {} settings", userId, results.size());
        return results;
    }

    /**
     * Returns the default notification settings matrix.
     * All notification types x event types = enabled by default.
     */
    @Transactional(readOnly = true)
    public List<NotificationSettingResponse> getDefaults() {
        List<NotificationSettingResponse> defaults = new ArrayList<>();
        for (NotificationType nType : NotificationType.values()) {
            for (EventType eType : EventType.values()) {
                defaults.add(new NotificationSettingResponse(
                        null,
                        null,
                        nType,
                        nType.getDisplayName(),
                        eType,
                        eType.getDisplayName(),
                        true
                ));
            }
        }
        return defaults;
    }

    /**
     * Checks whether a user has enabled a specific notification.
     * If no explicit setting exists, defaults to enabled.
     */
    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(UUID userId, NotificationType notificationType, EventType eventType) {
        return notificationSettingRepository
                .findByUserIdAndNotificationTypeAndEventTypeAndDeletedFalse(userId, notificationType, eventType)
                .map(NotificationSetting::isEnabled)
                .orElse(true); // default: enabled
    }
}
