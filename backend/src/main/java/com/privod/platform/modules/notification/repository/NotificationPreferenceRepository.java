package com.privod.platform.modules.notification.repository;

import com.privod.platform.modules.notification.domain.NotificationCategory;
import com.privod.platform.modules.notification.domain.NotificationChannel;
import com.privod.platform.modules.notification.domain.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("notificationNotificationPreferenceRepository")
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    List<NotificationPreference> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    Optional<NotificationPreference> findByUserIdAndOrganizationIdAndChannelAndCategory(
            UUID userId, UUID organizationId, NotificationChannel channel, NotificationCategory category);
}
