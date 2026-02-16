package com.privod.platform.modules.integration.telegram.repository;

import com.privod.platform.modules.integration.telegram.domain.TelegramLinkCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TelegramLinkCodeRepository extends JpaRepository<TelegramLinkCode, UUID> {

    Optional<TelegramLinkCode> findByCodeAndUsedFalseAndDeletedFalse(String code);

    Optional<TelegramLinkCode> findByUserIdAndUsedFalseAndDeletedFalse(UUID userId);

    void deleteByUserIdAndUsedFalseAndDeletedFalse(UUID userId);
}
