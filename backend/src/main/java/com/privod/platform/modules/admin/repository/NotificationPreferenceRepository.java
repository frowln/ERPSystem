package com.privod.platform.modules.admin.repository;

import com.privod.platform.modules.admin.domain.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("adminNotificationPreferenceRepository")
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {
    List<NotificationPreference> findByOrganizationIdOrderByEventTypeAsc(UUID organizationId);
    List<NotificationPreference> findByOrganizationIdAndRoleCodeOrderByEventTypeAsc(UUID organizationId, String roleCode);
    List<NotificationPreference> findByOrganizationIdAndUserIdOrderByEventTypeAsc(UUID organizationId, UUID userId);
}
