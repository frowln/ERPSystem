package com.privod.platform.modules.notification.repository;

import com.privod.platform.modules.notification.domain.BroadcastNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BroadcastNotificationRepository extends JpaRepository<BroadcastNotification, UUID> {

    List<BroadcastNotification> findByOrganizationIdAndActiveTrueAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);
}
