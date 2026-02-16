package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.domain.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, UUID> {

    Optional<SystemSetting> findBySettingKeyAndDeletedFalse(String settingKey);

    List<SystemSetting> findByCategoryAndDeletedFalseOrderBySettingKeyAsc(SettingCategory category);

    List<SystemSetting> findByDeletedFalseOrderByCategoryAscSettingKeyAsc();

    boolean existsBySettingKeyAndDeletedFalse(String settingKey);
}
