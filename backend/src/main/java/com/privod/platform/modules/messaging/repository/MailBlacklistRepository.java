package com.privod.platform.modules.messaging.repository;

import com.privod.platform.modules.messaging.domain.MailBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MailBlacklistRepository extends JpaRepository<MailBlacklist, UUID> {

    @Query("SELECT b FROM MailBlacklist b WHERE LOWER(b.email) = LOWER(:email) AND b.deleted = false")
    Optional<MailBlacklist> findByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM MailBlacklist b " +
            "WHERE LOWER(b.email) = LOWER(:email) AND b.isActive = true AND b.deleted = false")
    boolean isBlacklisted(@Param("email") String email);

    @Query("SELECT b FROM MailBlacklist b WHERE b.isActive = true AND b.deleted = false ORDER BY b.email ASC")
    List<MailBlacklist> findAllActive();
}
