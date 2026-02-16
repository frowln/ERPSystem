package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.EventType;
import com.privod.platform.modules.settings.domain.NotificationSetting;
import com.privod.platform.modules.settings.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, UUID> {

    List<NotificationSetting> findByUserIdAndDeletedFalse(UUID userId);

    Optional<NotificationSetting> findByUserIdAndNotificationTypeAndEventTypeAndDeletedFalse(
            UUID userId, NotificationType notificationType, EventType eventType);

    List<NotificationSetting> findByUserIdAndNotificationTypeAndDeletedFalse(
            UUID userId, NotificationType notificationType);

    List<NotificationSetting> findByEventTypeAndIsEnabledTrueAndDeletedFalse(EventType eventType);

    void deleteByUserIdAndDeletedFalse(UUID userId);
}
