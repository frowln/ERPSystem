package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.MfaConfig;
import com.privod.platform.modules.auth.domain.MfaMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MfaConfigRepository extends JpaRepository<MfaConfig, UUID> {

    Optional<MfaConfig> findByUserIdAndMethodAndDeletedFalse(UUID userId, MfaMethod method);

    List<MfaConfig> findByUserIdAndDeletedFalse(UUID userId);

    List<MfaConfig> findByUserIdAndIsEnabledTrueAndDeletedFalse(UUID userId);

    boolean existsByUserIdAndIsEnabledTrueAndDeletedFalse(UUID userId);
}
