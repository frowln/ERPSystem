package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    Optional<UserSession> findBySessionTokenAndIsActiveTrueAndDeletedFalse(String sessionToken);

    List<UserSession> findByUserIdAndIsActiveTrueAndDeletedFalse(UUID userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false " +
            "WHERE s.userId = :userId AND s.isActive = true AND s.deleted = false")
    int deactivateAllForUser(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false " +
            "WHERE s.isActive = true AND s.expiresAt < :now AND s.deleted = false")
    int deactivateExpired(@Param("now") Instant now);
}
