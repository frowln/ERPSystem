package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.MfaAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface MfaAttemptRepository extends JpaRepository<MfaAttempt, UUID> {

    Page<MfaAttempt> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    long countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
            UUID userId, Instant after);
}
