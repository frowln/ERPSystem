package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.AuditSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditSettingRepository extends JpaRepository<AuditSetting, UUID> {

    Optional<AuditSetting> findByModelNameAndDeletedFalse(String modelName);

    List<AuditSetting> findByDeletedFalseOrderByModelNameAsc();

    List<AuditSetting> findByIsActiveTrueAndDeletedFalse();

    boolean existsByModelNameAndDeletedFalse(String modelName);
}
