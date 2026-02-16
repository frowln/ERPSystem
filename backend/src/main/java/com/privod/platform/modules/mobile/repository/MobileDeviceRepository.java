package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.MobileDevice;
import com.privod.platform.modules.mobile.domain.MobilePlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MobileDeviceRepository extends JpaRepository<MobileDevice, UUID> {

    Optional<MobileDevice> findByIdAndDeletedFalse(UUID id);

    Optional<MobileDevice> findByDeviceTokenAndDeletedFalse(String deviceToken);

    List<MobileDevice> findByUserIdAndIsActiveTrueAndDeletedFalse(UUID userId);

    List<MobileDevice> findByUserIdAndPlatformAndIsActiveTrueAndDeletedFalse(UUID userId, MobilePlatform platform);

    long countByUserIdAndIsActiveTrueAndDeletedFalse(UUID userId);
}
