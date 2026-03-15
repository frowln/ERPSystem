package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByUserIdAndVerifiedAtIsNull(UUID userId);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :now")
    void deleteByExpiresAtBefore(Instant now);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.user.id = :userId AND t.verifiedAt IS NULL")
    void deleteUnverifiedByUserId(UUID userId);
}
