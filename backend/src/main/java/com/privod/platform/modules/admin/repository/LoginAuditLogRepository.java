package com.privod.platform.modules.admin.repository;

import com.privod.platform.modules.admin.domain.LoginAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoginAuditLogRepository extends JpaRepository<LoginAuditLog, UUID> {

    Page<LoginAuditLog> findByOrderByCreatedAtDesc(Pageable pageable);

    Page<LoginAuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<LoginAuditLog> findByEmailOrderByCreatedAtDesc(String email, Pageable pageable);

    Page<LoginAuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<LoginAuditLog> findBySuccessFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT l FROM LoginAuditLog l WHERE l.createdAt BETWEEN :from AND :to ORDER BY l.createdAt DESC")
    Page<LoginAuditLog> findByDateRange(@Param("from") Instant from, @Param("to") Instant to, Pageable pageable);

    long countByEmailAndSuccessFalseAndCreatedAtAfter(String email, Instant after);

    @Query("SELECT l.action, COUNT(l) FROM LoginAuditLog l WHERE l.createdAt > :since GROUP BY l.action")
    List<Object[]> countByActionSince(@Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT l.userId) FROM LoginAuditLog l WHERE l.action = 'LOGIN_SUCCESS' AND l.createdAt > :since")
    long countUniqueLoginsSince(@Param("since") Instant since);
}
