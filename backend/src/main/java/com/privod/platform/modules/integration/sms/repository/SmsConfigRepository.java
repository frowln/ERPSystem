package com.privod.platform.modules.integration.sms.repository;

import com.privod.platform.modules.integration.sms.domain.SmsConfig;
import com.privod.platform.modules.integration.sms.domain.SmsProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SmsConfigRepository extends JpaRepository<SmsConfig, UUID> {

    Optional<SmsConfig> findByEnabledTrueAndDeletedFalse();

    List<SmsConfig> findByDeletedFalse();

    Optional<SmsConfig> findByProviderAndDeletedFalse(SmsProvider provider);

    boolean existsByProviderAndDeletedFalse(SmsProvider provider);
}
