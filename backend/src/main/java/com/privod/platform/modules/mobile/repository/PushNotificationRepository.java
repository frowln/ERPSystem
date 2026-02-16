package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.PushNotification;
import com.privod.platform.modules.mobile.domain.PushNotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PushNotificationRepository extends JpaRepository<PushNotification, UUID> {

    Page<PushNotification> findByDeviceIdAndDeletedFalse(UUID deviceId, Pageable pageable);

    List<PushNotification> findByStatusAndDeletedFalse(PushNotificationStatus status);

    long countByStatusAndDeletedFalse(PushNotificationStatus status);
}
