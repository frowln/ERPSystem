package com.privod.platform.modules.auth.repository;

import com.privod.platform.modules.auth.domain.LoginAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, UUID> {

    Page<LoginAttempt> findByEmailAndDeletedFalse(String email, Pageable pageable);

    long countByEmailAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
            String email, Instant after);

    Page<LoginAttempt> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);
}
