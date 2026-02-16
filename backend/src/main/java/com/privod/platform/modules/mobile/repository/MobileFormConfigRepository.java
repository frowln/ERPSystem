package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.MobileFormConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MobileFormConfigRepository extends JpaRepository<MobileFormConfig, UUID> {

    Optional<MobileFormConfig> findByEntityTypeAndIsActiveTrueAndDeletedFalse(String entityType);

    List<MobileFormConfig> findByIsActiveTrueAndDeletedFalse();

    List<MobileFormConfig> findByOfflineCapableTrueAndIsActiveTrueAndDeletedFalse();
}
