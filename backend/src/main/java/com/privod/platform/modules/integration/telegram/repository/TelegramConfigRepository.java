package com.privod.platform.modules.integration.telegram.repository;

import com.privod.platform.modules.integration.telegram.domain.TelegramConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TelegramConfigRepository extends JpaRepository<TelegramConfig, UUID> {

    Optional<TelegramConfig> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    Optional<TelegramConfig> findByBotUsernameAndDeletedFalse(String botUsername);

    boolean existsByOrganizationIdAndDeletedFalse(UUID organizationId);
}
